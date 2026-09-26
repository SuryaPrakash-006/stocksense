from typing import Optional
from pydantic import BaseModel, EmailStr, Field, model_validator
from app.models.enums import UserRole
from app.schemas.user import UserResponse


class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=255, description="Full name")
    email: EmailStr = Field(..., description="Valid work email address")
    password: str = Field(..., min_length=8, description="Password minimum 8 characters")
    confirm_password: str = Field(..., min_length=8, description="Password confirmation")
    role: UserRole = Field(
        default=UserRole.WAREHOUSE_STAFF,
        description="Assigned role: INVENTORY_MANAGER or WAREHOUSE_STAFF",
    )

    @model_validator(mode="after")
    def passwords_match(self) -> "RegisterRequest":
        if self.password != self.confirm_password:
            raise ValueError("Passwords do not match")
        return self


class LoginRequest(BaseModel):
    email: EmailStr = Field(..., description="Registered email address")
    password: str = Field(..., description="Account password")


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class ForgotPasswordRequest(BaseModel):
    email: EmailStr = Field(..., description="Email address associated with account")


class ForgotPasswordResponse(BaseModel):
    message: str
    dev_otp: Optional[str] = Field(
        default=None,
        description="Development-only OTP code. Never populated in production mode.",
    )


class VerifyOTPRequest(BaseModel):
    email: EmailStr
    otp: str = Field(..., min_length=6, max_length=6, pattern=r"^\d{6}$")


class VerifyOTPResponse(BaseModel):
    message: str
    valid: bool


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp: str = Field(..., min_length=6, max_length=6, pattern=r"^\d{6}$")
    new_password: str = Field(..., min_length=8, description="New password minimum 8 characters")
    confirm_password: str = Field(..., min_length=8, description="Confirm new password")

    @model_validator(mode="after")
    def passwords_match(self) -> "ResetPasswordRequest":
        if self.new_password != self.confirm_password:
            raise ValueError("New passwords do not match")
        return self


class ResetPasswordResponse(BaseModel):
    message: str
