import logging
import secrets
from datetime import datetime, timedelta, timezone
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.core.security import get_password_hash, verify_password, create_access_token
from app.models.user import User
from app.repositories.user import UserRepository
from app.schemas.auth import (
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    LoginRequest,
    RegisterRequest,
    ResetPasswordRequest,
    ResetPasswordResponse,
    TokenResponse,
    VerifyOTPRequest,
    VerifyOTPResponse,
)
from app.schemas.user import UserResponse

logger = logging.getLogger("stocksense.auth")


class AuthService:
    @staticmethod
    async def register_user(db: AsyncSession, data: RegisterRequest) -> UserResponse:
        repo = UserRepository(db)
        existing_user = await repo.get_by_email(data.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A user with this email address is already registered.",
            )

        password_hash = get_password_hash(data.password)
        user = await repo.create_user(
            name=data.name,
            email=data.email,
            password_hash=password_hash,
            role=data.role,
        )
        return UserResponse.model_validate(user)

    @staticmethod
    async def authenticate_user(db: AsyncSession, data: LoginRequest) -> TokenResponse:
        repo = UserRepository(db)
        user = await repo.get_by_email(data.email)
        if not user or not verify_password(data.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email address or password.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is deactivated. Please contact your system administrator.",
            )

        token = create_access_token(subject=str(user.id))
        return TokenResponse(
            access_token=token,
            token_type="bearer",
            user=UserResponse.model_validate(user),
        )

    @staticmethod
    async def request_password_reset(
        db: AsyncSession, data: ForgotPasswordRequest
    ) -> ForgotPasswordResponse:
        repo = UserRepository(db)
        user = await repo.get_by_email(data.email)
        if not user:
            # Prevent email enumeration by returning a standard message
            return ForgotPasswordResponse(
                message="If the email is registered, a password reset OTP has been sent.",
                dev_otp=None,
            )

        # Generate cryptographically secure 6-digit numeric OTP
        otp_code = f"{secrets.randbelow(900000) + 100000:06d}"
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)

        await repo.save_otp(email=user.email, otp_code=otp_code, expires_at=expires_at)

        dev_otp_value = None
        if settings.ENVIRONMENT == "development" or settings.DEBUG:
            logger.info(
                f"[DEVELOPMENT OTP] Password reset requested for {user.email}: OTP is {otp_code} (Valid for 10 minutes)"
            )
            dev_otp_value = otp_code

        return ForgotPasswordResponse(
            message="If the email is registered, a password reset OTP has been sent.",
            dev_otp=dev_otp_value,
        )

    @staticmethod
    async def verify_otp(db: AsyncSession, data: VerifyOTPRequest) -> VerifyOTPResponse:
        repo = UserRepository(db)
        active_otp = await repo.get_latest_active_otp(data.email)
        if not active_otp:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired OTP code. Please request a new code.",
            )

        if active_otp.attempts >= 5:
            await repo.mark_otp_used(active_otp.id)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Too many incorrect attempts. Please request a new OTP code.",
            )

        if active_otp.otp_code != data.otp:
            await repo.increment_otp_attempts(active_otp.id)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid OTP code. Please check and try again.",
            )

        return VerifyOTPResponse(
            message="OTP code verified successfully.",
            valid=True,
        )

    @staticmethod
    async def reset_password(
        db: AsyncSession, data: ResetPasswordRequest
    ) -> ResetPasswordResponse:
        repo = UserRepository(db)
        user = await repo.get_by_email(data.email)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User account not found.",
            )

        active_otp = await repo.get_latest_active_otp(data.email)
        if not active_otp or active_otp.otp_code != data.otp:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired OTP code.",
            )

        # Hash new password and update
        new_password_hash = get_password_hash(data.new_password)
        await repo.update_password(user.id, new_password_hash)
        await repo.mark_otp_used(active_otp.id)

        return ResetPasswordResponse(
            message="Password has been reset successfully. You can now log in with your new password."
        )
