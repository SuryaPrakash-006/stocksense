import pytest
import pytest_asyncio
from httpx import AsyncClient


@pytest_asyncio.fixture
async def auth_token(client: AsyncClient) -> str:
    await client.post(
        "/api/v1/auth/register",
        json={
            "name": "Delivery Manager",
            "email": "delivery.mgr@stocksense.com",
            "password": "Password123!",
            "confirm_password": "Password123!",
            "role": "INVENTORY_MANAGER",
        },
    )
    res = await client.post(
        "/api/v1/auth/login",
        json={"email": "delivery.mgr@stocksense.com", "password": "Password123!"},
    )
    return res.json()["access_token"]


@pytest.mark.asyncio
async def test_delivery_order_lifecycle(client: AsyncClient, auth_token: str):
    headers = {"Authorization": f"Bearer {auth_token}"}

    # 1. Create Warehouse & Location
    wh_res = await client.post(
        "/api/v1/warehouses",
        json={"name": "Outbound Depot", "code": "OUT-1"},
        headers=headers,
    )
    loc_id = wh_res.json()["locations"][0]["id"]

    # 2. Create Customer
    cust_res = await client.post(
        "/api/v1/customers",
        json={"name": "Global Construction Ltd", "code": "GCL"},
        headers=headers,
    )
    assert cust_res.status_code == 201
    cust_id = cust_res.json()["id"]

    # 3. Create Product with 50 units initial stock at loc_id
    prod_res = await client.post(
        "/api/v1/products",
        json={
            "name": "Office Chair Ergonomic",
            "sku": "CHAIR-ERGO-01",
            "unit_of_measure": "Units",
            "reorder_level": "5.0000",
            "initial_stock": "50.0000",
            "initial_location_id": loc_id,
        },
        headers=headers,
    )
    prod_id = prod_res.json()["id"]

    # 4. Create Delivery Order for 60 units (EXCEEDS available stock 50)
    deliv_excess = await client.post(
        "/api/v1/deliveries",
        json={
            "customer_id": cust_id,
            "source_location_id": loc_id,
            "items": [{"product_id": prod_id, "quantity": "60.0000"}],
        },
        headers=headers,
    )
    assert deliv_excess.status_code == 201
    deliv_excess_id = deliv_excess.json()["id"]

    # Attempt to validate excess delivery -> MUST FAIL with 400 Insufficient Stock
    val_fail = await client.post(
        f"/api/v1/deliveries/{deliv_excess_id}/validate", headers=headers
    )
    assert val_fail.status_code == 400
    assert "Insufficient stock" in val_fail.json()["detail"]

    # 5. Create Valid Delivery Order for 20 units
    deliv_res = await client.post(
        "/api/v1/deliveries",
        json={
            "customer_id": cust_id,
            "source_location_id": loc_id,
            "notes": "Sales Order #4492",
            "items": [{"product_id": prod_id, "quantity": "20.0000"}],
        },
        headers=headers,
    )
    assert deliv_res.status_code == 201
    deliv_data = deliv_res.json()
    deliv_id = deliv_data["id"]
    assert deliv_data["has_sufficient_stock"] is True

    # 6. Advance states: DRAFT -> WAITING (Picking) -> READY (Packed)
    await client.put(
        f"/api/v1/deliveries/{deliv_id}",
        json={"status": "WAITING"},
        headers=headers,
    )
    await client.put(
        f"/api/v1/deliveries/{deliv_id}",
        json={"status": "READY"},
        headers=headers,
    )

    # 7. Validate & Ship
    val_res = await client.post(
        f"/api/v1/deliveries/{deliv_id}/validate", headers=headers
    )
    assert val_res.status_code == 200
    assert val_res.json()["status"] == "DONE"

    # 8. Check product stock decreased from 50 to 30
    prod_check = await client.get(f"/api/v1/products/{prod_id}", headers=headers)
    assert float(prod_check.json()["total_stock"]) == 30.0
    assert float(prod_check.json()["location_stocks"][0]["quantity"]) == 30.0

    # 9. Verify DELIVERY ledger movement
    movements = prod_check.json()["movements"]
    assert len(movements) == 2  # initial receipt + delivery
    delivery_mov = next(m for m in movements if m["transaction_type"] == "DELIVERY")
    assert float(delivery_mov["quantity_change"]) == -20.0
    assert float(delivery_mov["quantity_after"]) == 30.0
