import uuid
from typing import List, Optional, Tuple
from sqlalchemy import asc, desc, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload, joinedload
from app.models.enums import DocumentStatus
from app.models.partner import Supplier
from app.models.product import Product
from app.models.receipt import Receipt, ReceiptItem
from app.models.warehouse import Location, Warehouse
from app.models.user import User
from app.repositories.base import BaseRepository


class ReceiptRepository(BaseRepository[Receipt]):
    def __init__(self, db: AsyncSession):
        super().__init__(Receipt, db)

    async def get_by_id_with_relations(self, receipt_id: uuid.UUID) -> Optional[Receipt]:
        stmt = (
            select(Receipt)
            .where(Receipt.id == receipt_id)
            .options(
                selectinload(Receipt.supplier),
                selectinload(Receipt.destination_location).selectinload(Location.warehouse),
                selectinload(Receipt.creator),
                selectinload(Receipt.validator),
                selectinload(Receipt.items).selectinload(ReceiptItem.product).selectinload(Product.category),
            )
        )
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def get_by_number(self, receipt_number: str) -> Optional[Receipt]:
        stmt = select(Receipt).where(
            func.lower(Receipt.receipt_number) == receipt_number.strip().lower()
        )
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def list_receipts(
        self,
        search: Optional[str] = None,
        status: Optional[DocumentStatus] = None,
        supplier_id: Optional[uuid.UUID] = None,
        destination_location_id: Optional[uuid.UUID] = None,
        warehouse_id: Optional[uuid.UUID] = None,
        page: int = 1,
        page_size: int = 20,
        sort_by: str = "created_at",
        sort_order: str = "desc",
    ) -> Tuple[List[Receipt], int]:
        stmt = (
            select(Receipt)
            .options(
                selectinload(Receipt.supplier),
                selectinload(Receipt.destination_location).selectinload(Location.warehouse),
                selectinload(Receipt.creator),
                selectinload(Receipt.validator),
                selectinload(Receipt.items).selectinload(ReceiptItem.product),
            )
        )

        if search:
            pattern = f"%{search.strip().lower()}%"
            stmt = stmt.outerjoin(Supplier, Receipt.supplier_id == Supplier.id).where(
                or_(
                    func.lower(Receipt.receipt_number).like(pattern),
                    func.lower(Supplier.name).like(pattern),
                )
            )

        if status:
            stmt = stmt.where(Receipt.status == status)

        if supplier_id:
            stmt = stmt.where(Receipt.supplier_id == supplier_id)

        if destination_location_id:
            stmt = stmt.where(Receipt.destination_location_id == destination_location_id)
        elif warehouse_id:
            stmt = stmt.join(
                Location, Receipt.destination_location_id == Location.id
            ).where(Location.warehouse_id == warehouse_id)

        # Count total
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total_result = await self.db.execute(count_stmt)
        total_count = total_result.scalar() or 0

        # Sort
        if sort_by == "receipt_number":
            sort_col = Receipt.receipt_number
        elif sort_by == "status":
            sort_col = Receipt.status
        else:
            sort_col = Receipt.created_at

        if sort_order.lower() == "asc":
            stmt = stmt.order_by(asc(sort_col))
        else:
            stmt = stmt.order_by(desc(sort_col))

        # Pagination
        offset = (page - 1) * page_size
        stmt = stmt.offset(offset).limit(page_size)

        result = await self.db.execute(stmt)
        return list(result.scalars().all()), total_count
