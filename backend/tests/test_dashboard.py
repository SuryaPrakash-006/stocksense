import pytest
import pytest_asyncio
from httpx import AsyncClient


@pytest_asyncio.fixture
async def auth_token(client: AsyncClient) -> str:
    await client.post(
        "/api/v1/auth/register",
        json={
            "name": "Dashboard Manager",
            "email": "dashboard.mgr@stocksense.com",
            "password": "Password123!",
            "confirm_password": "Password123!",
            "role": "INVENTORY_MANAGER",
        },
    )
    res = await client.post(
        "/api/v1/auth/login",
        json={"email": "dashboard.mgr@stocksense.com", "password": "Password123!"},
    )
    return res.json()["access_token"]


@pytest.mark.asyncio
async def test_dashboard_empty_database(client: AsyncClient, auth_token: str):
    headers = {"Authorization": f"Bearer {auth_token}"}

    # Clean database dashboard overview
    res = await client.get("/api/v1/dashboard/overview", headers=headers)
    assert res.status_code == 200
    data = res.json()

    kpis = data["kpis"]
    assert kpis["total_products_in_stock"] == 0
    assert float(kpis["total_units_in_stock"]) == 0.0
    assert kpis["low_stock_items"] == 0
    assert kpis["out_of_stock_items"] == 0
    assert kpis["pending_receipts"] == 0
    assert kpis["pending_deliveries"] == 0
    assert kpis["scheduled_transfers"] == 0

    assert data["low_stock_list"] == []
    assert data["category_breakdown"] == []
    assert data["warehouse_breakdown"] == []
    assert data["recent_activity"] == []


@pytest.mark.asyncio
async def test_dashboard_populated_kpis(client: AsyncClient, auth_token: str):
    headers = {"Authorization": f"Bearer {auth_token}"}

    # 1. Create Warehouse & Location
    wh_res = await client.post(
        "/api/v1/warehouses",
        json={"name": "Primary Hub", "code": "HUB-1"},
        headers=headers,
    )
    loc_id = wh_res.json()["locations"][0]["id"]
    wh_id = wh_res.json()["id"]

    # 2. Create Category
    cat_res = await client.post(
        "/api/v1/categories",
        json={"name": "Fasteners", "code": "FAST"},
        headers=headers,
    )
    cat_id = cat_res.json()["id"]

    # 3. Create Product 1 (In Stock: 100 > reorder 20)
    await client.post(
        "/api/v1/products",
        json={
            "name": "Hex Bolt M8",
            "sku": "BOLT-M8",
            "category_id": cat_id,
            "unit_of_measure": "Units",
            "reorder_level": "20.0000",
            "initial_stock": "100.0000",
            "initial_location_id": loc_id,
        },
        headers=headers,
    )

    # 4. Create Product 2 (Low Stock: 5 <= reorder 15)
    await client.post(
        "/api/v1/products",
        json={
            "name": "Hex Nut M8",
            "sku": "NUT-M8",
            "category_id": cat_id,
            "unit_of_measure": "Units",
            "reorder_level": "15.0000",
            "initial_stock": "5.0000",
            "initial_location_id": loc_id,
        },
        headers=headers,
    )

    # 5. Create Product 3 (Out of Stock: 0)
    await client.post(
        "/api/v1/products",
        json={
            "name": "Washer M8",
            "sku": "WASH-M8",
            "category_id": cat_id,
            "unit_of_measure": "Units",
            "reorder_level": "10.0000",
        },
        headers=headers,
    )

    # 6. Verify Dashboard KPI Calculations
    dash_res = await client.get("/api/v1/dashboard/overview", headers=headers)
    assert dash_res.status_code == 200
    dash_data = dash_res.json()
    kpis = dash_data["kpis"]

    assert kpis["total_products_in_stock"] == 2  # BOLT-M8 (100) and NUT-M8 (5)
    assert float(kpis["total_units_in_stock"]) == 105.0
    assert kpis["low_stock_items"] == 1  # NUT-M8
    assert kpis["out_of_stock_items"] == 1  # WASH-M8

    assert len(dash_data["low_stock_list"]) == 2
    assert len(dash_data["category_breakdown"]) == 1
    assert dash_data["category_breakdown"][0]["category_name"] == "Fasteners"
    assert float(dash_data["category_breakdown"][0]["total_stock"]) == 105.0

    # 7. Test Dashboard with Warehouse Filter
    filtered_res = await client.get(
        "/api/v1/dashboard/overview",
        params={"warehouse_id": wh_id},
        headers=headers,
    )
    assert filtered_res.status_code == 200
    assert filtered_res.json()["kpis"]["total_products_in_stock"] == 2
