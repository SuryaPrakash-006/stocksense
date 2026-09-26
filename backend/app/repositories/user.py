import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import desc, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import PasswordResetOTP, User
from app.models.enums import UserRole
from app.repositories.base import BaseRepository


class UserRepository(BaseRepository[User]):
    def __init__(self, db: AsyncSession):
        super().__init__(User, db)

    async def get_by_email(self, email: str) -> Optional[User]:
        result = await self.db.execute(
            select(User).where(User.email == email.strip().lower())
        )
        return result.scalars().first()

    async def create_user(
        self,
        name: str,
        email: str,
        password_hash: str,
        role: UserRole = UserRole.WAREHOUSE_STAFF,
    ) -> User:
        user = User(
            name=name.strip(),
            email=email.strip().lower(),
            password_hash=password_hash,
            role=role,
            is_active=True,
        )
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def update_password(self, user_id: uuid.UUID, new_password_hash: str) -> None:
        await self.db.execute(
            update(User)
            .where(User.id == user_id)
            .values(password_hash=new_password_hash)
        )
        await self.db.commit()

    async def save_otp(
        self,
        email: str,
        otp_code: str,
        expires_at: datetime,
    ) -> PasswordResetOTP:
        # Invalidate previous unused OTPs for this email
        await self.db.execute(
            update(PasswordResetOTP)
            .where(
                PasswordResetOTP.email == email.strip().lower(),
                PasswordResetOTP.is_used == False,
            )
            .values(is_used=True)
        )
        otp = PasswordResetOTP(
            email=email.strip().lower(),
            otp_code=otp_code,
            expires_at=expires_at,
            is_used=False,
            attempts=0,
        )
        self.db.add(otp)
        await self.db.commit()
        await self.db.refresh(otp)
        return otp

    async def get_latest_active_otp(
        self,
        email: str,
    ) -> Optional[PasswordResetOTP]:
        now = datetime.now(timezone.utc)
        result = await self.db.execute(
            select(PasswordResetOTP)
            .where(
                PasswordResetOTP.email == email.strip().lower(),
                PasswordResetOTP.is_used == False,
                PasswordResetOTP.expires_at > now,
            )
            .order_by(desc(PasswordResetOTP.created_at))
        )
        return result.scalars().first()

    async def mark_otp_used(self, otp_id: uuid.UUID) -> None:
        await self.db.execute(
            update(PasswordResetOTP)
            .where(PasswordResetOTP.id == otp_id)
            .values(is_used=True)
        )
        await self.db.commit()

    async def increment_otp_attempts(self, otp_id: uuid.UUID) -> None:
        await self.db.execute(
            update(PasswordResetOTP)
            .where(PasswordResetOTP.id == otp_id)
            .values(attempts=PasswordResetOTP.attempts + 1)
        )
        await self.db.commit()
