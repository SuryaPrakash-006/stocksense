import pytest
import pytest_asyncio
from httpx import AsyncClient


@pytest_asyncio.fixture
async def auth_token(client: AsyncClient) -> str:
    await client.post(
        "/api/v1/auth/register",
        json={
            "name": "Audit Officer",
            "email": "auditor@stocksense.com",
            "password": "Password123!",
            "confirm_password": "Password123!",
            "role": "INVENTORY_MANAGER",
        },
    )
    res = await client.post(
        "/api/v1/auth/login",
        json={"email": "auditor@stocksense.com", "password": "Password123!"},
    )
    return res.json()["access_token"]


@pytest.mark.asyncio
async def test_stock_ledger_empty_state(client: AsyncClient, auth_token: str):
    headers = {"Authorization": f"Bearer {auth_token}"}

    res = await client.get("/api/v1/stock-ledger", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["items"] == []
    assert data["total"] == 0

    stats_res = await client.get("/api/v1/stock-ledger/stats", headers=headers)
    assert stats_res.status_code == 200
    stats = stats_res.json()
    assert stats["total_moves"] == 0


@pytest.mark.asyncio
async def test_stock_ledger_complete_audit_trail(client: AsyncClient, auth_token: str):
    headers = {"Authorization": f"Bearer {auth_token}"}

    # 1. Setup Facilities
    wh1_res = await client.post(
        "/api/v1/warehouses",
        json={"name": "Logistics Hub 1", "code": "LH-1"},
        headers=headers,
    )
    assert wh1_res.status_code == 201
    wh1 = wh1_res.json()
    loc1_id = wh1["locations"][0]["id"]
    wh1_id = wh1["id"]

    wh2_res = await client.post(
        "/api/v1/warehouses",
        json={"name": "Logistics Hub 2", "code": "LH-2"},
        headers=headers,
    )
    loc2_id = wh2_res.json()["locations"][0]["id"]

    # 2. Setup Partners
    sup_res = await client.post(
        "/api/v1/suppliers",
        json={"name": "Global Metals Ltd", "code": "GML-SUP"},
        headers=headers,
    )
    sup_id = sup_res.json()["id"]

    cust_res = await client.post(
        "/api/v1/customers",
        json={"name": "BuildCorp Enterprises", "code": "BC-CUST"},
        headers=headers,
    )
    cust_id = cust_res.json()["id"]

    # 3. Create Product
    prod_res = await client.post(
        "/api/v1/products",
        json={
            "name": "Titanium Rod 20mm",
            "sku": "ROD-TI-20",
            "unit_of_measure": "Units",
            "reorder_level": "10.0000",
        },
        headers=headers,
    )
    prod_id = prod_res.json()["id"]

    # Operation 1: RECEIPT (+100 units at loc1)
    rcpt_res = await client.post(
        "/api/v1/receipts",
        json={
            "supplier_id": sup_id,
            "destination_location_id": loc1_id,
            "items": [{"product_id": prod_id, "quantity": "100.0000"}],
        },
        headers=headers,
    )
    rcpt_id = rcpt_res.json()["id"]
    await client.post(f"/api/v1/receipts/{rcpt_id}/validate", headers=headers)

    # Operation 2: DELIVERY (-20 units from loc1)
    del_res = await client.post(
        "/api/v1/deliveries",
        json={
            "customer_id": cust_id,
            "source_location_id": loc1_id,
            "items": [{"product_id": prod_id, "quantity": "20.0000"}],
        },
        headers=headers,
    )
    del_id = del_res.json()["id"]
    await client.post(f"/api/v1/deliveries/{del_id}/validate", headers=headers)

    # Operation 3: TRANSFER (-30 units loc1 -> +30 units loc2)
    tr_res = await client.post(
        "/api/v1/transfers",
        json={
            "source_location_id": loc1_id,
            "destination_location_id": loc2_id,
            "items": [{"product_id": prod_id, "quantity": "30.0000"}],
        },
        headers=headers,
    )
    tr_id = tr_res.json()["id"]
    await client.post(f"/api/v1/transfers/{tr_id}/validate", headers=headers)

    # Operation 4: ADJUSTMENT (Reconcile loc1 from 50 to 55 units -> +5 units)
    adj_res = await client.post(
        "/api/v1/adjustments",
        json={
            "product_id": prod_id,
            "location_id": loc1_id,
            "counted_quantity": "55.0000",
            "reason": "Quarterly physical audit found extra unboxed rod",
        },
        headers=headers,
    )
    adj_id = adj_res.json()["id"]
    await client.post(f"/api/v1/adjustments/{adj_id}/validate", headers=headers)

    # 4. Verify Stock Ledger Total Records
    # Expected: 1 (RECEIPT) + 1 (DELIVERY) + 2 (TRANSFER_OUT & TRANSFER_IN) + 1 (ADJUSTMENT) = 5 entries
    ledger_res = await client.get("/api/v1/stock-ledger", headers=headers)
    assert ledger_res.status_code == 200
    ledger_data = ledger_res.json()
    assert ledger_data["total"] == 5

    # Check stats endpoint
    stats_res = await client.get("/api/v1/stock-ledger/stats", headers=headers)
    assert stats_res.status_code == 200
    stats = stats_res.json()
    assert stats["total_moves"] == 5
    assert stats["receipts_count"] == 1
    assert stats["deliveries_count"] == 1
    assert stats["transfers_count"] == 2
    assert stats["adjustments_count"] == 1

    # 5. Filter tests
    # Filter by transaction_type=RECEIPT
    f_rcpt = await client.get("/api/v1/stock-ledger?transaction_type=RECEIPT", headers=headers)
    assert f_rcpt.json()["total"] == 1
    item = f_rcpt.json()["items"][0]
    assert item["transaction_type"] == "RECEIPT"
    assert float(item["quantity_before"]) == 0.0
    assert float(item["quantity_change"]) == 100.0
    assert float(item["quantity_after"]) == 100.0

    # Filter by SKU
    f_sku = await client.get("/api/v1/stock-ledger?sku=ROD-TI-20", headers=headers)
    assert f_sku.json()["total"] == 5

    # Filter by warehouse_id
    f_wh = await client.get(f"/api/v1/stock-ledger?warehouse_id={wh1_id}", headers=headers)
    # LH-1 had receipt, delivery, transfer_out, adjustment = 4
    assert f_wh.json()["total"] == 4

    # Single entry lookup
    first_id = ledger_data["items"][0]["id"]
    single_res = await client.get(f"/api/v1/stock-ledger/{first_id}", headers=headers)
    assert single_res.status_code == 200
    assert single_res.json()["id"] == first_id
    assert single_res.json()["product_sku"] == "ROD-TI-20"
