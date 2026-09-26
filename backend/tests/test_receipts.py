import pytest
import pytest_asyncio
from httpx import AsyncClient


@pytest_asyncio.fixture
async def auth_token(client: AsyncClient) -> str:
    await client.post(
        "/api/v1/auth/register",
        json={
            "name": "Inventory Manager",
            "email": "receipt.mgr@stocksense.com",
            "password": "Password123!",
            "confirm_password": "Password123!",
            "role": "INVENTORY_MANAGER",
        },
    )
    res = await client.post(
        "/api/v1/auth/login",
        json={"email": "receipt.mgr@stocksense.com", "password": "Password123!"},
    )
    return res.json()["access_token"]


@pytest.mark.asyncio
async def test_receipt_full_lifecycle(client: AsyncClient, auth_token: str):
    headers = {"Authorization": f"Bearer {auth_token}"}

    # 1. Create Warehouse & Location
    wh_res = await client.post(
        "/api/v1/warehouses",
        json={"name": "Central Depot", "code": "DEPOT-1"},
        headers=headers,
    )
    wh_data = wh_res.json()
    loc_id = wh_data["locations"][0]["id"]

    # 2. Create Supplier
    sup_res = await client.post(
        "/api/v1/suppliers",
        json={"name": "Acme Steel Supplies", "code": "ACME"},
        headers=headers,
    )
    assert sup_res.status_code == 201
    sup_id = sup_res.json()["id"]

    # 3. Create Product (with 0 initial stock)
    prod_res = await client.post(
        "/api/v1/products",
        json={
            "name": "Steel Beam 50mm",
            "sku": "BEAM-50-001",
            "unit_of_measure": "Units",
            "reorder_level": "10.0000",
        },
        headers=headers,
    )
    prod_id = prod_res.json()["id"]
    assert float(prod_res.json()["total_stock"]) == 0.0

    # 4. Create Receipt (DRAFT)
    rec_res = await client.post(
        "/api/v1/receipts",
        json={
            "supplier_id": sup_id,
            "destination_location_id": loc_id,
            "notes": "PO-10029 vendor shipment",
            "items": [{"product_id": prod_id, "quantity": "50.0000"}],
        },
        headers=headers,
    )
    assert rec_res.status_code == 201
    rec_data = rec_res.json()
    rec_id = rec_data["id"]
    assert rec_data["status"] == "DRAFT"
    assert rec_data["total_items"] == 1
    assert float(rec_data["total_quantity"]) == 50.0

    # Verify stock NOT increased yet
    prod_check_1 = await client.get(f"/api/v1/products/{prod_id}", headers=headers)
    assert float(prod_check_1.json()["total_stock"]) == 0.0

    # 5. Move status DRAFT -> WAITING -> READY
    upd_res = await client.put(
        f"/api/v1/receipts/{rec_id}",
        json={"status": "READY"},
        headers=headers,
    )
    assert upd_res.status_code == 200
    assert upd_res.json()["status"] == "READY"

    # 6. Validate Receipt (Atomically increases stock & logs to ledger)
    val_res = await client.post(f"/api/v1/receipts/{rec_id}/validate", headers=headers)
    assert val_res.status_code == 200
    val_data = val_res.json()
    assert val_data["status"] == "DONE"
    assert val_data["validated_by"] is not None
    assert val_data["validated_at"] is not None

    # 7. Verify stock HAS INCREASED
    prod_check_2 = await client.get(f"/api/v1/products/{prod_id}", headers=headers)
    assert float(prod_check_2.json()["total_stock"]) == 50.0
    assert len(prod_check_2.json()["location_stocks"]) == 1
    assert float(prod_check_2.json()["location_stocks"][0]["quantity"]) == 50.0
    assert len(prod_check_2.json()["movements"]) == 1
    assert prod_check_2.json()["movements"][0]["transaction_type"] == "RECEIPT"
    assert float(prod_check_2.json()["movements"][0]["quantity_change"]) == 50.0

    # 8. Re-validation must fail
    re_val = await client.post(f"/api/v1/receipts/{rec_id}/validate", headers=headers)
    assert re_val.status_code == 400

    # 9. Cancellation after DONE must fail
    can_res = await client.post(f"/api/v1/receipts/{rec_id}/cancel", headers=headers)
    assert can_res.status_code == 400
