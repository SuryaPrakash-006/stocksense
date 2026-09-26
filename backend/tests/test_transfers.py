import pytest
import pytest_asyncio
from httpx import AsyncClient


@pytest_asyncio.fixture
async def auth_token(client: AsyncClient) -> str:
    await client.post(
        "/api/v1/auth/register",
        json={
            "name": "Transfer Operator",
            "email": "transfer.operator@stocksense.com",
            "password": "Password123!",
            "confirm_password": "Password123!",
            "role": "INVENTORY_MANAGER",
        },
    )
    res = await client.post(
        "/api/v1/auth/login",
        json={"email": "transfer.operator@stocksense.com", "password": "Password123!"},
    )
    return res.json()["access_token"]


@pytest.mark.asyncio
async def test_internal_transfer_lifecycle(client: AsyncClient, auth_token: str):
    headers = {"Authorization": f"Bearer {auth_token}"}

    # 1. Create Source Warehouse & Location
    wh1_res = await client.post(
        "/api/v1/warehouses",
        json={"name": "Warehouse Alpha", "code": "WH-A"},
        headers=headers,
    )
    assert wh1_res.status_code == 201
    wh1_id = wh1_res.json()["id"]
    loc_src_id = wh1_res.json()["locations"][0]["id"]

    # 2. Create Destination Warehouse & Location
    wh2_res = await client.post(
        "/api/v1/warehouses",
        json={"name": "Warehouse Beta", "code": "WH-B"},
        headers=headers,
    )
    assert wh2_res.status_code == 201
    loc_dst_id = wh2_res.json()["locations"][0]["id"]

    # 3. Create Product with 100 units at loc_src_id
    prod_res = await client.post(
        "/api/v1/products",
        json={
            "name": "Industrial Valve 50mm",
            "sku": "VALVE-50-IND",
            "unit_of_measure": "Units",
            "reorder_level": "10.0000",
            "initial_stock": "100.0000",
            "initial_location_id": loc_src_id,
        },
        headers=headers,
    )
    assert prod_res.status_code == 201
    prod_id = prod_res.json()["id"]

    # 4. Attempt transfer with identical source & destination -> MUST FAIL validation
    same_loc_res = await client.post(
        "/api/v1/transfers",
        json={
            "source_location_id": loc_src_id,
            "destination_location_id": loc_src_id,
            "items": [{"product_id": prod_id, "quantity": "25.0000"}],
        },
        headers=headers,
    )
    assert same_loc_res.status_code == 422
    assert "must be different" in same_loc_res.text

    # 5. Create transfer exceeding available stock (150 > 100) -> Validation must fail
    excess_res = await client.post(
        "/api/v1/transfers",
        json={
            "source_location_id": loc_src_id,
            "destination_location_id": loc_dst_id,
            "items": [{"product_id": prod_id, "quantity": "150.0000"}],
        },
        headers=headers,
    )
    assert excess_res.status_code == 201
    excess_id = excess_res.json()["id"]

    excess_val = await client.post(
        f"/api/v1/transfers/{excess_id}/validate", headers=headers
    )
    assert excess_val.status_code == 400
    assert "Insufficient stock" in excess_val.json()["detail"]

    # 6. Create valid transfer for 40 units
    transfer_res = await client.post(
        "/api/v1/transfers",
        json={
            "source_location_id": loc_src_id,
            "destination_location_id": loc_dst_id,
            "notes": "Rebalance stock between WH-A and WH-B",
            "items": [{"product_id": prod_id, "quantity": "40.0000"}],
        },
        headers=headers,
    )
    assert transfer_res.status_code == 201
    transfer_data = transfer_res.json()
    transfer_id = transfer_data["id"]
    assert transfer_data["status"] == "DRAFT"
    assert transfer_data["has_sufficient_stock"] is True

    # 7. Update status: DRAFT -> READY
    ready_res = await client.put(
        f"/api/v1/transfers/{transfer_id}",
        json={"status": "READY"},
        headers=headers,
    )
    assert ready_res.status_code == 200
    assert ready_res.json()["status"] == "READY"

    # 8. Validate transfer (Deduct 40 from src, add 40 to dst)
    val_res = await client.post(
        f"/api/v1/transfers/{transfer_id}/validate", headers=headers
    )
    assert val_res.status_code == 200
    val_data = val_res.json()
    assert val_data["status"] == "DONE"
    assert val_data["completed_at"] is not None

    # 9. Verify product stock breakdown:
    # - Total stock must still be EXACTLY 100
    # - Source location has 60
    # - Destination location has 40
    prod_check = await client.get(f"/api/v1/products/{prod_id}", headers=headers)
    assert prod_check.status_code == 200
    prod_data = prod_check.json()
    assert float(prod_data["total_stock"]) == 100.0

    loc_stocks = {l["location_id"]: float(l["quantity"]) for l in prod_data["location_stocks"]}
    assert loc_stocks[loc_src_id] == 60.0
    assert loc_stocks[loc_dst_id] == 40.0

    # 10. Check Move History API
    moves_res = await client.get(
        "/api/v1/moves",
        params={"product_id": prod_id},
        headers=headers,
    )
    assert moves_res.status_code == 200
    moves_data = moves_res.json()
    assert moves_data["total"] >= 3  # Initial receipt + TRANSFER_OUT + TRANSFER_IN
    tx_types = [m["transaction_type"] for m in moves_data["items"]]
    assert "TRANSFER_OUT" in tx_types
    assert "TRANSFER_IN" in tx_types

    # Move statistics
    stats_res = await client.get("/api/v1/moves/stats", headers=headers)
    assert stats_res.status_code == 200
    stats_data = stats_res.json()
    assert stats_data["total_moves"] >= 3
