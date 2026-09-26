import uuid
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.partner import Customer, Supplier
from app.repositories.base import BaseRepository


class SupplierRepository(BaseRepository[Supplier]):
    def __init__(self, db: AsyncSession):
        super().__init__(Supplier, db)

    async def get_all_active(self) -> List[Supplier]:
        stmt = select(Supplier).where(Supplier.is_active == True).order_by(Supplier.name.asc())
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_by_code(self, code: str) -> Optional[Supplier]:
        stmt = select(Supplier).where(Supplier.code == code.strip().upper())
        result = await self.db.execute(stmt)
        return result.scalars().first()


class CustomerRepository(BaseRepository[Customer]):
    def __init__(self, db: AsyncSession):
        super().__init__(Customer, db)

    async def get_all_active(self) -> List[Customer]:
        stmt = select(Customer).where(Customer.is_active == True).order_by(Customer.name.asc())
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_by_code(self, code: str) -> Optional[Customer]:
        stmt = select(Customer).where(Customer.code == code.strip().upper())
        result = await self.db.execute(stmt)
        return result.scalars().first()
