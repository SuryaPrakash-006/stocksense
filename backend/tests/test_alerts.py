import pytest
import pytest_asyncio
from httpx import AsyncClient


@pytest_asyncio.fixture
async def auth_token(client: AsyncClient) -> str:
    await client.post(
        "/api/v1/auth/register",
        json={
            "name": "Alerts Manager",
            "email": "alerts.mgr@stocksense.com",
            "password": "Password123!",
            "confirm_password": "Password123!",
            "role": "INVENTORY_MANAGER",
        },
    )
    res = await client.post(
        "/api/v1/auth/login",
        json={"email": "alerts.mgr@stocksense.com", "password": "Password123!"},
    )
    return res.json()["access_token"]


@pytest.mark.asyncio
async def test_alerts_empty_database(client: AsyncClient, auth_token: str):
    headers = {"Authorization": f"Bearer {auth_token}"}

    # Summary
    res = await client.get("/api/v1/alerts/summary", headers=headers)
    assert res.status_code == 200
    summary = res.json()
    assert summary["total_alerts"] == 0
    assert summary["low_stock_count"] == 0
    assert summary["out_of_stock_count"] == 0

    # Low stock list
    res = await client.get("/api/v1/alerts/low-stock", headers=headers)
    assert res.status_code == 200
    assert res.json()["items"] == []
    assert res.json()["total"] == 0

    # Out of stock list
    res = await client.get("/api/v1/alerts/out-of-stock", headers=headers)
    assert res.status_code == 200
    assert res.json()["items"] == []
    assert res.json()["total"] == 0


@pytest.mark.asyncio
async def test_low_and_out_of_stock_alert_lifecycle(client: AsyncClient, auth_token: str):
    headers = {"Authorization": f"Bearer {auth_token}"}

    # 1. Create Warehouse & Location
    wh_res = await client.post(
        "/api/v1/warehouses",
        json={"name": "Alerts Distribution Center", "code": "ADC-1"},
        headers=headers,
    )
    assert wh_res.status_code == 201
    loc_id = wh_res.json()["locations"][0]["id"]
    wh_id = wh_res.json()["id"]

    # 2. Create Supplier
    sup_res = await client.post(
        "/api/v1/suppliers",
        json={"name": "Apex Supply Co", "code": "APEX-SUP"},
        headers=headers,
    )
    sup_id = sup_res.json()["id"]

    # 3. Create 3 Products with different reorder levels:
    # Prod A: Reorder level 20, initial receipt 5 (LOW_STOCK: 0 < 5 <= 20)
    # Prod B: Reorder level 10, receipt 0 / unstocked (OUT_OF_STOCK: qty <= 0)
    # Prod C: Reorder level 10, initial receipt 50 (IN_STOCK: qty 50 > 10)
    p_a = (await client.post(
        "/api/v1/products",
        json={"name": "Widget Alpha", "sku": "WGT-ALPHA-01", "reorder_level": 20.0, "unit_of_measure": "Units"},
        headers=headers,
    )).json()

    p_b = (await client.post(
        "/api/v1/products",
        json={"name": "Widget Beta", "sku": "WGT-BETA-02", "reorder_level": 10.0, "unit_of_measure": "Units"},
        headers=headers,
    )).json()

    p_c = (await client.post(
        "/api/v1/products",
        json={"name": "Widget Gamma", "sku": "WGT-GAMMA-03", "reorder_level": 10.0, "unit_of_measure": "Units"},
        headers=headers,
    )).json()

    # 4. Receive stock for Prod A (5 units) and Prod C (50 units)
    rcpt_res = await client.post(
        "/api/v1/receipts",
        json={
            "supplier_id": sup_id,
            "destination_location_id": loc_id,
            "items": [
                {"product_id": p_a["id"], "quantity": "5.0000"},
                {"product_id": p_c["id"], "quantity": "50.0000"},
            ],
        },
        headers=headers,
    )
    assert rcpt_res.status_code == 201
    rcpt = rcpt_res.json()

    # Validate receipt to post to real PostgreSQL stock balances
    val_res = await client.post(f"/api/v1/receipts/{rcpt['id']}/validate", headers=headers)
    assert val_res.status_code == 200

    # 5. Check Alerts Summary
    sum_res = await client.get("/api/v1/alerts/summary", headers=headers)
    assert sum_res.status_code == 200
    summary = sum_res.json()
    assert summary["low_stock_count"] == 1  # Widget Alpha
    assert summary["out_of_stock_count"] == 1  # Widget Beta
    assert summary["in_stock_count"] == 1  # Widget Gamma
    assert summary["total_alerts"] == 2
    assert summary["critical_count"] == 1
    assert summary["warning_count"] == 1

    # 6. Check Low Stock endpoint
    low_res = await client.get("/api/v1/alerts/low-stock", headers=headers)
    assert low_res.status_code == 200
    low_data = low_res.json()
    assert low_data["total"] == 1
    assert low_data["items"][0]["product_sku"] == "WGT-ALPHA-01"
    assert low_data["items"][0]["status"] == "LOW_STOCK"
    assert low_data["items"][0]["severity"] == "WARNING"
    assert float(low_data["items"][0]["current_quantity"]) == 5.0
    assert float(low_data["items"][0]["reorder_level"]) == 20.0
    assert float(low_data["items"][0]["deficit_quantity"]) == 15.0

    # 7. Check Out of Stock endpoint
    oos_res = await client.get("/api/v1/alerts/out-of-stock", headers=headers)
    assert oos_res.status_code == 200
    oos_data = oos_res.json()
    assert oos_data["total"] == 1
    assert oos_data["items"][0]["product_sku"] == "WGT-BETA-02"
    assert oos_data["items"][0]["status"] == "OUT_OF_STOCK"
    assert oos_data["items"][0]["severity"] == "CRITICAL"
    assert float(oos_data["items"][0]["current_quantity"]) == 0.0

    # 8. Check All Alerts endpoint with search
    search_res = await client.get("/api/v1/alerts?search=ALPHA", headers=headers)
    assert search_res.status_code == 200
    assert len(search_res.json()["items"]) == 1
    assert search_res.json()["items"][0]["product_sku"] == "WGT-ALPHA-01"
