import pytest
import pytest_asyncio
from httpx import AsyncClient


@pytest_asyncio.fixture
async def manager_token(client: AsyncClient) -> str:
    res = await client.post(
        "/api/v1/auth/register",
        json={
            "name": "Manager User",
            "email": "manager.test@stocksense.com",
            "password": "Password123!",
            "confirm_password": "Password123!",
            "role": "INVENTORY_MANAGER",
        },
    )
    login_res = await client.post(
        "/api/v1/auth/login",
        json={"email": "manager.test@stocksense.com", "password": "Password123!"},
    )
    return login_res.json()["access_token"]


@pytest_asyncio.fixture
async def staff_token(client: AsyncClient) -> str:
    res = await client.post(
        "/api/v1/auth/register",
        json={
            "name": "Staff User",
            "email": "staff.test@stocksense.com",
            "password": "Password123!",
            "confirm_password": "Password123!",
            "role": "WAREHOUSE_STAFF",
        },
    )
    login_res = await client.post(
        "/api/v1/auth/login",
        json={"email": "staff.test@stocksense.com", "password": "Password123!"},
    )
    return login_res.json()["access_token"]


@pytest.mark.asyncio
async def test_category_lifecycle(client: AsyncClient, manager_token: str, staff_token: str):
    headers = {"Authorization": f"Bearer {manager_token}"}
    staff_headers = {"Authorization": f"Bearer {staff_token}"}

    # 1. Staff forbidden to create category
    forbidden_res = await client.post(
        "/api/v1/categories",
        json={"name": "Metals", "code": "MET", "description": "Raw metals"},
        headers=staff_headers,
    )
    assert forbidden_res.status_code == 403

    # 2. Manager creates category
    create_res = await client.post(
        "/api/v1/categories",
        json={"name": "Raw Materials", "code": "RAW", "description": "Base inventory"},
        headers=headers,
    )
    assert create_res.status_code == 201
    cat_data = create_res.json()
    cat_id = cat_data["id"]
    assert cat_data["name"] == "Raw Materials"
    assert cat_data["code"] == "RAW"

    # 3. Duplicate category rejection
    dup_res = await client.post(
        "/api/v1/categories",
        json={"name": "Raw Materials"},
        headers=headers,
    )
    assert dup_res.status_code == 400

    # 4. List categories
    list_res = await client.get("/api/v1/categories", headers=headers)
    assert list_res.status_code == 200
    assert len(list_res.json()) >= 1

    # 5. Update category
    upd_res = await client.put(
        f"/api/v1/categories/{cat_id}",
        json={"name": "Raw Materials Updated", "code": "RAW-UPD"},
        headers=headers,
    )
    assert upd_res.status_code == 200
    assert upd_res.json()["name"] == "Raw Materials Updated"


@pytest.mark.asyncio
async def test_product_creation_and_stock_allocation(
    client: AsyncClient, manager_token: str
):
    headers = {"Authorization": f"Bearer {manager_token}"}

    # 1. Create warehouse & location
    wh_res = await client.post(
        "/api/v1/warehouses",
        json={"name": "Main Warehouse", "code": "WH1", "address": "123 Industrial Park"},
        headers=headers,
    )
    assert wh_res.status_code == 201
    wh_data = wh_res.json()
    location_id = wh_data["locations"][0]["id"]

    # 2. Create category
    cat_res = await client.post(
        "/api/v1/categories",
        json={"name": "Steel Components", "code": "STL"},
        headers=headers,
    )
    cat_id = cat_res.json()["id"]

    # 3. Create product with initial stock
    prod_res = await client.post(
        "/api/v1/products",
        json={
            "name": "Steel Rod 10mm",
            "sku": "ROD-10MM-001",
            "category_id": cat_id,
            "unit_of_measure": "Meters",
            "reorder_level": "20.0000",
            "initial_stock": "100.0000",
            "initial_location_id": location_id,
        },
        headers=headers,
    )
    assert prod_res.status_code == 201
    prod_data = prod_res.json()
    prod_id = prod_data["id"]
    assert prod_data["sku"] == "ROD-10MM-001"
    assert float(prod_data["total_stock"]) == 100.0
    assert prod_data["stock_status"] == "IN_STOCK"
    assert len(prod_data["location_stocks"]) == 1
    assert float(prod_data["location_stocks"][0]["quantity"]) == 100.0
    assert len(prod_data["movements"]) == 1
    assert prod_data["movements"][0]["transaction_type"] == "RECEIPT"

    # 4. Duplicate SKU rejection
    dup_res = await client.post(
        "/api/v1/products",
        json={
            "name": "Another Rod",
            "sku": "ROD-10MM-001",
            "unit_of_measure": "Meters",
        },
        headers=headers,
    )
    assert dup_res.status_code == 400

    # 5. List with search & category filter
    search_res = await client.get(
        "/api/v1/products",
        params={"search": "ROD-10MM", "category_id": cat_id, "stock_status": "IN_STOCK"},
        headers=headers,
    )
    assert search_res.status_code == 200
    assert search_res.json()["total"] == 1
    assert search_res.json()["items"][0]["id"] == prod_id

    # 6. Get Product Details
    detail_res = await client.get(f"/api/v1/products/{prod_id}", headers=headers)
    assert detail_res.status_code == 200
    assert detail_res.json()["name"] == "Steel Rod 10mm"

    # 7. Update Product
    update_res = await client.put(
        f"/api/v1/products/{prod_id}",
        json={"name": "Steel Rod 10mm Heavy Duty", "reorder_level": "25.0000"},
        headers=headers,
    )
    assert update_res.status_code == 200
    assert update_res.json()["name"] == "Steel Rod 10mm Heavy Duty"
    assert float(update_res.json()["reorder_level"]) == 25.0
