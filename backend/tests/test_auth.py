import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_signup_success(client: AsyncClient):
    payload = {
        "name": "Jane Manager",
        "email": "jane.manager@stocksense.com",
        "password": "SecurePassword123!",
        "confirm_password": "SecurePassword123!",
        "role": "INVENTORY_MANAGER",
    }
    response = await client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Jane Manager"
    assert data["email"] == "jane.manager@stocksense.com"
    assert data["role"] == "INVENTORY_MANAGER"
    assert data["is_active"] is True
    assert "id" in data
    assert "password_hash" not in data


@pytest.mark.asyncio
async def test_signup_duplicate_email(client: AsyncClient):
    payload = {
        "name": "Jane Manager",
        "email": "duplicate@stocksense.com",
        "password": "SecurePassword123!",
        "confirm_password": "SecurePassword123!",
        "role": "INVENTORY_MANAGER",
    }
    res1 = await client.post("/api/v1/auth/register", json=payload)
    assert res1.status_code == 201

    res2 = await client.post("/api/v1/auth/register", json=payload)
    assert res2.status_code == 400
    assert "already registered" in res2.json()["detail"]


@pytest.mark.asyncio
async def test_signup_password_mismatch(client: AsyncClient):
    payload = {
        "name": "Jane Manager",
        "email": "mismatch@stocksense.com",
        "password": "SecurePassword123!",
        "confirm_password": "DifferentPassword123!",
        "role": "INVENTORY_MANAGER",
    }
    response = await client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_login_invalid_credentials(client: AsyncClient):
    payload = {
        "email": "nonexistent@stocksense.com",
        "password": "WrongPassword123!",
    }
    response = await client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == 401
    assert "Invalid email address or password" in response.json()["detail"]


@pytest.mark.asyncio
async def test_login_valid_credentials(client: AsyncClient):
    # Register first
    signup_payload = {
        "name": "Warehouse Worker",
        "email": "worker@stocksense.com",
        "password": "WorkerPassword123!",
        "confirm_password": "WorkerPassword123!",
        "role": "WAREHOUSE_STAFF",
    }
    reg_res = await client.post("/api/v1/auth/register", json=signup_payload)
    assert reg_res.status_code == 201

    # Login
    login_payload = {
        "email": "worker@stocksense.com",
        "password": "WorkerPassword123!",
    }
    login_res = await client.post("/api/v1/auth/login", json=login_payload)
    assert login_res.status_code == 200
    data = login_res.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "worker@stocksense.com"
    assert data["user"]["role"] == "WAREHOUSE_STAFF"


@pytest.mark.asyncio
async def test_protected_me_endpoint_success(client: AsyncClient):
    # Register & Login
    signup_payload = {
        "name": "Auth User",
        "email": "authuser@stocksense.com",
        "password": "AuthPassword123!",
        "confirm_password": "AuthPassword123!",
        "role": "INVENTORY_MANAGER",
    }
    await client.post("/api/v1/auth/register", json=signup_payload)

    login_res = await client.post(
        "/api/v1/auth/login",
        json={"email": "authuser@stocksense.com", "password": "AuthPassword123!"},
    )
    token = login_res.json()["access_token"]

    # Access protected /me endpoint
    me_res = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert me_res.status_code == 200
    assert me_res.json()["email"] == "authuser@stocksense.com"
    assert me_res.json()["name"] == "Auth User"


@pytest.mark.asyncio
async def test_protected_endpoint_unauthorized(client: AsyncClient):
    # Missing authorization header
    res1 = await client.get("/api/v1/auth/me")
    assert res1.status_code == 401

    # Invalid token
    res2 = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": "Bearer invalid.jwt.token"},
    )
    assert res2.status_code == 401


@pytest.mark.asyncio
async def test_password_reset_flow(client: AsyncClient):
    # 1. Register User
    email = "reset.flow@stocksense.com"
    old_password = "OldPassword123!"
    new_password = "NewStrongPassword456!"

    await client.post(
        "/api/v1/auth/register",
        json={
            "name": "Reset Test User",
            "email": email,
            "password": old_password,
            "confirm_password": old_password,
            "role": "WAREHOUSE_STAFF",
        },
    )

    # 2. Request OTP
    forgot_res = await client.post(
        "/api/v1/auth/forgot-password",
        json={"email": email},
    )
    assert forgot_res.status_code == 200
    dev_otp = forgot_res.json().get("dev_otp")
    assert dev_otp is not None
    assert len(dev_otp) == 6

    # 3. Verify OTP with invalid code
    bad_verify = await client.post(
        "/api/v1/auth/verify-otp",
        json={"email": email, "otp": "000000"},
    )
    assert bad_verify.status_code == 400

    # 4. Verify OTP with valid code
    good_verify = await client.post(
        "/api/v1/auth/verify-otp",
        json={"email": email, "otp": dev_otp},
    )
    assert good_verify.status_code == 200
    assert good_verify.json()["valid"] is True

    # 5. Reset Password
    reset_res = await client.post(
        "/api/v1/auth/reset-password",
        json={
            "email": email,
            "otp": dev_otp,
            "new_password": new_password,
            "confirm_password": new_password,
        },
    )
    assert reset_res.status_code == 200

    # 6. Try to login with old password (Must Fail)
    old_login = await client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": old_password},
    )
    assert old_login.status_code == 401

    # 7. Login with new password (Must Succeed)
    new_login = await client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": new_password},
    )
    assert new_login.status_code == 200
    assert "access_token" in new_login.json()
