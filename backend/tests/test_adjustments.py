import pytest
import pytest_asyncio
from httpx import AsyncClient


@pytest_asyncio.fixture
async def auth_token(client: AsyncClient) -> str:
    await client.post(
        "/api/v1/auth/register",
        json={
            "name": "Audit Manager",
            "email": "audit.manager@stocksense.com",
            "password": "Password123!",
            "confirm_password": "Password123!",
            "role": "INVENTORY_MANAGER",
        },
    )
    res = await client.post(
        "/api/v1/auth/login",
        json={"email": "audit.manager@stocksense.com", "password": "Password123!"},
    )
    return res.json()["access_token"]


@pytest.mark.asyncio
async def test_inventory_adjustment_lifecycle(client: AsyncClient, auth_token: str):
    headers = {"Authorization": f"Bearer {auth_token}"}

    # 1. Create Warehouse & Location
    wh_res = await client.post(
        "/api/v1/warehouses",
        json={"name": "Audit Warehouse", "code": "WH-AUDIT"},
        headers=headers,
    )
    assert wh_res.status_code == 201
    loc_id = wh_res.json()["locations"][0]["id"]

    # 2. Create Product with 50 units initial stock
    prod_res = await client.post(
        "/api/v1/products",
        json={
            "name": "Heavy Duty Bolts M12",
            "sku": "BOLT-M12-001",
            "unit_of_measure": "Units",
            "reorder_level": "10.0000",
            "initial_stock": "50.0000",
            "initial_location_id": loc_id,
        },
        headers=headers,
    )
    assert prod_res.status_code == 201
    prod_id = prod_res.json()["id"]

    # 3. Create Inventory Adjustment (Physical count finds 45 units instead of 50 -> -5 discrepancy)
    adj_res = await client.post(
        "/api/v1/adjustments",
        json={
            "product_id": prod_id,
            "location_id": loc_id,
            "counted_quantity": "45.0000",
            "reason": "Quarterly physical stocktake audit: 5 units damaged/discarded",
        },
        headers=headers,
    )
    assert adj_res.status_code == 201
    adj_data = adj_res.json()
    adj_id = adj_data["id"]
    assert adj_data["status"] == "DRAFT"
    assert float(adj_data["previous_quantity"]) == 50.0
    assert float(adj_data["counted_quantity"]) == 45.0
    assert float(adj_data["difference"]) == -5.0

    # Stock should NOT change while in DRAFT
    prod_check_1 = await client.get(f"/api/v1/products/{prod_id}", headers=headers)
    assert float(prod_check_1.json()["total_stock"]) == 50.0

    # Check stock-lookup endpoint
    lookup_res = await client.get(
        "/api/v1/adjustments/stock-lookup",
        params={"product_id": prod_id, "location_id": loc_id},
        headers=headers,
    )
    assert lookup_res.status_code == 200
    assert float(lookup_res.json()["recorded_quantity"]) == 50.0

    # 4. Validate Adjustment via /validate endpoint
    val_res = await client.post(
        f"/api/v1/adjustments/{adj_id}/validate", headers=headers
    )
    assert val_res.status_code == 200
    applied_data = val_res.json()
    assert applied_data["status"] == "DONE"
    assert applied_data["validated_by"] is not None
    assert applied_data["validated_at"] is not None

    # 5. Verify product stock updated to 45
    prod_check_2 = await client.get(f"/api/v1/products/{prod_id}", headers=headers)
    assert float(prod_check_2.json()["total_stock"]) == 45.0
    assert float(prod_check_2.json()["location_stocks"][0]["quantity"]) == 45.0

    # 6. Verify immutable stock ledger entry
    movements = prod_check_2.json()["movements"]
    adj_mov = next(m for m in movements if m["transaction_type"] == "ADJUSTMENT")
    assert float(adj_mov["quantity_before"]) == 50.0
    assert float(adj_mov["quantity_change"]) == -5.0
    assert float(adj_mov["quantity_after"]) == 45.0

    # 7. Re-validating must fail
    re_val = await client.post(
        f"/api/v1/adjustments/{adj_id}/validate", headers=headers
    )
    assert re_val.status_code == 400

    # 8. Canceling a DONE adjustment must fail
    can_res = await client.post(
        f"/api/v1/adjustments/{adj_id}/cancel", headers=headers
    )
    assert can_res.status_code == 400
