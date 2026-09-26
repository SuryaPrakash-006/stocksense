import pytest
import pytest_asyncio
from httpx import AsyncClient


@pytest_asyncio.fixture
async def manager_token(client: AsyncClient) -> str:
    await client.post(
        "/api/v1/auth/register",
        json={
            "name": "Audit Manager",
            "email": "audit.chief@stocksense.com",
            "password": "Password123!",
            "confirm_password": "Password123!",
            "role": "INVENTORY_MANAGER",
        },
    )
    res = await client.post(
        "/api/v1/auth/login",
        json={"email": "audit.chief@stocksense.com", "password": "Password123!"},
    )
    return res.json()["access_token"]


@pytest_asyncio.fixture
async def staff_token(client: AsyncClient) -> str:
    await client.post(
        "/api/v1/auth/register",
        json={
            "name": "Warehouse Worker",
            "email": "staff.worker@stocksense.com",
            "password": "Password123!",
            "confirm_password": "Password123!",
            "role": "WAREHOUSE_STAFF",
        },
    )
    res = await client.post(
        "/api/v1/auth/login",
        json={"email": "staff.worker@stocksense.com", "password": "Password123!"},
    )
    return res.json()["access_token"]


@pytest.mark.asyncio
async def test_full_operational_scenario_audit_trace(
    client: AsyncClient, manager_token: str, staff_token: str
):
    """Executes the exact scenario:
    1. Receive 100 kg Steel
    2. Stock becomes +100 at Main Store
    3. Transfer 40 kg to Production Rack
    4. Main Store = 60 kg
    5. Production Rack = 40 kg
    6. Deliver 20 kg from Production Rack
    7. Production Rack = 20 kg
    8. Adjust 3 kg damaged (Count = 17 kg)
    9. Production Rack = 17 kg
    Verify ledger sequence, atomic balances, negative stock prevention, and authorization.
    """
    mgr_headers = {"Authorization": f"Bearer {manager_token}"}
    staff_headers = {"Authorization": f"Bearer {staff_token}"}

    # -------------------------------------------------------------
    # SETUP FACILITIES & LOCATIONS
    # -------------------------------------------------------------
    # Create Main Warehouse with "Main Store" and "Production Rack" locations
    wh_res = await client.post(
        "/api/v1/warehouses",
        json={"name": "Central Works", "code": "CW-01"},
        headers=mgr_headers,
    )
    assert wh_res.status_code == 201
    wh_id = wh_res.json()["id"]

    # Location 1: Main Store (INTERNAL)
    loc_main_res = await client.post(
        "/api/v1/warehouses/locations",
        json={"warehouse_id": wh_id, "name": "Main Store", "code": "MAIN-STORE", "location_type": "INTERNAL"},
        headers=mgr_headers,
    )
    assert loc_main_res.status_code == 201
    loc_main_id = loc_main_res.json()["id"]

    # Location 2: Production Rack (PRODUCTION)
    loc_prod_res = await client.post(
        "/api/v1/warehouses/locations",
        json={"warehouse_id": wh_id, "name": "Production Rack", "code": "PROD-RACK", "location_type": "PRODUCTION"},
        headers=mgr_headers,
    )
    assert loc_prod_res.status_code == 201
    loc_prod_id = loc_prod_res.json()["id"]

    # -------------------------------------------------------------
    # SETUP PARTNERS & PRODUCT
    # -------------------------------------------------------------
    # Supplier
    sup_res = await client.post(
        "/api/v1/suppliers",
        json={"name": "Tata Steel Ltd", "code": "TATA-STEEL"},
        headers=mgr_headers,
    )
    assert sup_res.status_code == 201
    sup_id = sup_res.json()["id"]

    # Customer
    cust_res = await client.post(
        "/api/v1/customers",
        json={"name": "Mahindra Heavy Ind", "code": "MHI-CUST"},
        headers=mgr_headers,
    )
    assert cust_res.status_code == 201
    cust_id = cust_res.json()["id"]

    # Product: Steel (kg)
    prod_res = await client.post(
        "/api/v1/products",
        json={
            "name": "Structural Steel 316L",
            "sku": "STEEL-316L-KG",
            "unit_of_measure": "kg",
            "reorder_level": "25.0000",
        },
        headers=mgr_headers,
    )
    assert prod_res.status_code == 201
    prod_id = prod_res.json()["id"]

    # Verify initial stock is 0.0000
    prod_detail = (await client.get(f"/api/v1/products/{prod_id}", headers=mgr_headers)).json()
    assert float(prod_detail["total_stock"]) == 0.0

    # -------------------------------------------------------------
    # STEP 1 & 2: RECEIVE 100 kg Steel at Main Store -> Stock = 100 kg
    # -------------------------------------------------------------
    rcpt_create = await client.post(
        "/api/v1/receipts",
        json={
            "supplier_id": sup_id,
            "destination_location_id": loc_main_id,
            "items": [{"product_id": prod_id, "quantity": "100.0000"}],
            "notes": "Initial raw material shipment",
        },
        headers=mgr_headers,
    )
    assert rcpt_create.status_code == 201
    rcpt_id = rcpt_create.json()["id"]

    # Validate receipt (atomic stock balance increment + stock_ledger entry)
    rcpt_val = await client.post(f"/api/v1/receipts/{rcpt_id}/validate", headers=mgr_headers)
    assert rcpt_val.status_code == 200
    assert rcpt_val.json()["status"] == "DONE"

    # Verify Main Store balance = 100 kg
    prod_check_1 = (await client.get(f"/api/v1/products/{prod_id}", headers=mgr_headers)).json()
    assert float(prod_check_1["total_stock"]) == 100.0
    main_bal_1 = next(b for b in prod_check_1["location_stocks"] if b["location_id"] == loc_main_id)
    assert float(main_bal_1["quantity"]) == 100.0

    # -------------------------------------------------------------
    # STEP 3, 4, 5: TRANSFER 40 kg to Production Rack
    # Main Store = 60 kg, Production Rack = 40 kg, Total Company Stock = 100 kg
    # -------------------------------------------------------------
    tr_create = await client.post(
        "/api/v1/transfers",
        json={
            "source_location_id": loc_main_id,
            "destination_location_id": loc_prod_id,
            "items": [{"product_id": prod_id, "quantity": "40.0000"}],
            "notes": "Move to assembly staging rack",
        },
        headers=mgr_headers,
    )
    assert tr_create.status_code == 201
    tr_id = tr_create.json()["id"]

    # Validate transfer
    tr_val = await client.post(f"/api/v1/transfers/{tr_id}/validate", headers=mgr_headers)
    assert tr_val.status_code == 200
    assert tr_val.json()["status"] == "DONE"

    # Verify balances: Main Store = 60, Production Rack = 40, Total = 100
    prod_check_2 = (await client.get(f"/api/v1/products/{prod_id}", headers=mgr_headers)).json()
    assert float(prod_check_2["total_stock"]) == 100.0  # Conserved!
    main_bal_2 = next(b for b in prod_check_2["location_stocks"] if b["location_id"] == loc_main_id)
    prod_bal_2 = next(b for b in prod_check_2["location_stocks"] if b["location_id"] == loc_prod_id)
    assert float(main_bal_2["quantity"]) == 60.0
    assert float(prod_bal_2["quantity"]) == 40.0

    # -------------------------------------------------------------
    # STEP 6 & 7: DELIVER 20 kg from Production Rack -> Production Rack = 20 kg
    # -------------------------------------------------------------
    del_create = await client.post(
        "/api/v1/deliveries",
        json={
            "customer_id": cust_id,
            "source_location_id": loc_prod_id,
            "items": [{"product_id": prod_id, "quantity": "20.0000"}],
            "notes": "Customer order #SO-9921",
        },
        headers=mgr_headers,
    )
    assert del_create.status_code == 201
    del_id = del_create.json()["id"]

    # Validate delivery order
    del_val = await client.post(f"/api/v1/deliveries/{del_id}/validate", headers=mgr_headers)
    assert del_val.status_code == 200
    assert del_val.json()["status"] == "DONE"

    # Verify balances: Main Store = 60, Production Rack = 20, Total = 80
    prod_check_3 = (await client.get(f"/api/v1/products/{prod_id}", headers=mgr_headers)).json()
    assert float(prod_check_3["total_stock"]) == 80.0
    prod_bal_3 = next(b for b in prod_check_3["location_stocks"] if b["location_id"] == loc_prod_id)
    assert float(prod_bal_3["quantity"]) == 20.0

    # -------------------------------------------------------------
    # STEP 8 & 9: ADJUST 3 kg damaged (Physical Count = 17 kg) -> Production Rack = 17 kg
    # -------------------------------------------------------------
    adj_create = await client.post(
        "/api/v1/adjustments",
        json={
            "product_id": prod_id,
            "location_id": loc_prod_id,
            "counted_quantity": "17.0000",
            "reason": "3 kg rusted / damaged during assembly process",
        },
        headers=mgr_headers,
    )
    assert adj_create.status_code == 201
    adj_id = adj_create.json()["id"]

    # Validate adjustment
    adj_val = await client.post(f"/api/v1/adjustments/{adj_id}/validate", headers=mgr_headers)
    assert adj_val.status_code == 200
    assert adj_val.json()["status"] == "DONE"

    # Verify final balances: Main Store = 60, Production Rack = 17, Total = 77 kg
    prod_check_4 = (await client.get(f"/api/v1/products/{prod_id}", headers=mgr_headers)).json()
    assert float(prod_check_4["total_stock"]) == 77.0
    main_bal_4 = next(b for b in prod_check_4["location_stocks"] if b["location_id"] == loc_main_id)
    prod_bal_4 = next(b for b in prod_check_4["location_stocks"] if b["location_id"] == loc_prod_id)
    assert float(main_bal_4["quantity"]) == 60.0
    assert float(prod_bal_4["quantity"]) == 17.0

    # -------------------------------------------------------------
    # STEP 10: VERIFY LEDGER IMMUTABLE AUDIT TRAIL SEQUENCE
    # Expected Chronological Sequence (Ascending):
    # 1. RECEIPT: Main Store (before=0, change=+100, after=100)
    # 2. TRANSFER_OUT: Main Store (before=100, change=-40, after=60)
    # 3. TRANSFER_IN: Production Rack (before=0, change=+40, after=40)
    # 4. DELIVERY: Production Rack (before=40, change=-20, after=20)
    # 5. ADJUSTMENT: Production Rack (before=20, change=-3, after=17)
    # -------------------------------------------------------------
    ledger_res = await client.get(
        f"/api/v1/stock-ledger?sku=STEEL-316L-KG&sort_order=asc", headers=mgr_headers
    )
    assert ledger_res.status_code == 200
    ledger_data = ledger_res.json()
    assert ledger_data["total"] == 5
    entries = ledger_data["items"]

    # Entry 1: RECEIPT
    assert entries[0]["transaction_type"] == "RECEIPT"
    assert entries[0]["location_id"] == loc_main_id
    assert float(entries[0]["quantity_before"]) == 0.0
    assert float(entries[0]["quantity_change"]) == 100.0
    assert float(entries[0]["quantity_after"]) == 100.0

    # Entry 2: TRANSFER_OUT
    assert entries[1]["transaction_type"] == "TRANSFER_OUT"
    assert entries[1]["location_id"] == loc_main_id
    assert float(entries[1]["quantity_before"]) == 100.0
    assert float(entries[1]["quantity_change"]) == -40.0
    assert float(entries[1]["quantity_after"]) == 60.0

    # Entry 3: TRANSFER_IN
    assert entries[2]["transaction_type"] == "TRANSFER_IN"
    assert entries[2]["location_id"] == loc_prod_id
    assert float(entries[2]["quantity_before"]) == 0.0
    assert float(entries[2]["quantity_change"]) == 40.0
    assert float(entries[2]["quantity_after"]) == 40.0

    # Entry 4: DELIVERY
    assert entries[3]["transaction_type"] == "DELIVERY"
    assert entries[3]["location_id"] == loc_prod_id
    assert float(entries[3]["quantity_before"]) == 40.0
    assert float(entries[3]["quantity_change"]) == -20.0
    assert float(entries[3]["quantity_after"]) == 20.0

    # Entry 5: ADJUSTMENT
    assert entries[4]["transaction_type"] == "ADJUSTMENT"
    assert entries[4]["location_id"] == loc_prod_id
    assert float(entries[4]["quantity_before"]) == 20.0
    assert float(entries[4]["quantity_change"]) == -3.0
    assert float(entries[4]["quantity_after"]) == 17.0

    # -------------------------------------------------------------
    # STEP 11: NEGATIVE STOCK PREVENTION
    # Attempt to deliver 25 kg from Production Rack (only 17 kg available)
    # -------------------------------------------------------------
    del_excess = await client.post(
        "/api/v1/deliveries",
        json={
            "customer_id": cust_id,
            "source_location_id": loc_prod_id,
            "items": [{"product_id": prod_id, "quantity": "25.0000"}],
        },
        headers=mgr_headers,
    )
    del_excess_id = del_excess.json()["id"]

    excess_val = await client.post(f"/api/v1/deliveries/{del_excess_id}/validate", headers=mgr_headers)
    assert excess_val.status_code == 400
    assert "insufficient" in excess_val.json()["detail"].lower() or "available" in excess_val.json()["detail"].lower()

    # Verify Production Rack stock is STILL exactly 17 kg (no partial change or ledger entry created)
    prod_check_final = (await client.get(f"/api/v1/products/{prod_id}", headers=mgr_headers)).json()
    prod_bal_final = next(b for b in prod_check_final["location_stocks"] if b["location_id"] == loc_prod_id)
    assert float(prod_bal_final["quantity"]) == 17.0

    # Total ledger count is STILL 5
    ledger_count_check = await client.get(
        f"/api/v1/stock-ledger?sku=STEEL-316L-KG", headers=mgr_headers
    )
    assert ledger_count_check.json()["total"] == 5

    # -------------------------------------------------------------
    # STEP 12: BACKEND ROLE AUTHORIZATION ENFORCEMENT
    # Staff cannot perform manager-only actions (creating new warehouse or deleting product)
    # -------------------------------------------------------------
    wh_unauth = await client.post(
        "/api/v1/warehouses",
        json={"name": "Illegal Warehouse", "code": "ILL-01"},
        headers=staff_headers,
    )
    assert wh_unauth.status_code == 403

    del_prod_unauth = await client.delete(f"/api/v1/products/{prod_id}", headers=staff_headers)
    assert del_prod_unauth.status_code == 403
