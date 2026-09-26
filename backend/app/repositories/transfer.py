import uuid
from typing import List, Optional, Tuple
from sqlalchemy import asc, desc, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.models.enums import DocumentStatus
from app.models.product import Product
from app.models.transfer import InternalTransfer, InternalTransferItem
from app.models.warehouse import Location, Warehouse
from app.models.user import User
from app.repositories.base import BaseRepository


class TransferRepository(BaseRepository[InternalTransfer]):
    def __init__(self, db: AsyncSession):
        super().__init__(InternalTransfer, db)

    async def get_by_id_with_relations(
        self, transfer_id: uuid.UUID
    ) -> Optional[InternalTransfer]:
        stmt = (
            select(InternalTransfer)
            .where(InternalTransfer.id == transfer_id)
            .options(
                selectinload(InternalTransfer.source_location).selectinload(Location.warehouse),
                selectinload(InternalTransfer.destination_location).selectinload(Location.warehouse),
                selectinload(InternalTransfer.creator),
                selectinload(InternalTransfer.completer),
                selectinload(InternalTransfer.items)
                .selectinload(InternalTransferItem.product)
                .selectinload(Product.category),
            )
        )
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def get_by_number(self, transfer_number: str) -> Optional[InternalTransfer]:
        stmt = select(InternalTransfer).where(
            func.lower(InternalTransfer.transfer_number) == transfer_number.strip().lower()
        )
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def list_transfers(
        self,
        search: Optional[str] = None,
        status: Optional[DocumentStatus] = None,
        source_location_id: Optional[uuid.UUID] = None,
        destination_location_id: Optional[uuid.UUID] = None,
        warehouse_id: Optional[uuid.UUID] = None,
        page: int = 1,
        page_size: int = 20,
        sort_by: str = "created_at",
        sort_order: str = "desc",
    ) -> Tuple[List[InternalTransfer], int]:
        stmt = (
            select(InternalTransfer)
            .options(
                selectinload(InternalTransfer.source_location).selectinload(Location.warehouse),
                selectinload(InternalTransfer.destination_location).selectinload(Location.warehouse),
                selectinload(InternalTransfer.creator),
                selectinload(InternalTransfer.completer),
                selectinload(InternalTransfer.items).selectinload(InternalTransferItem.product),
            )
        )

        if search:
            pattern = f"%{search.strip().lower()}%"
            stmt = stmt.where(func.lower(InternalTransfer.transfer_number).like(pattern))

        if status:
            stmt = stmt.where(InternalTransfer.status == status)

        if source_location_id:
            stmt = stmt.where(InternalTransfer.source_location_id == source_location_id)
        if destination_location_id:
            stmt = stmt.where(InternalTransfer.destination_location_id == destination_location_id)

        if warehouse_id:
            # Matches if either source or destination is in this warehouse
            loc_sub = select(Location.id).where(Location.warehouse_id == warehouse_id)
            stmt = stmt.where(
                or_(
                    InternalTransfer.source_location_id.in_(loc_sub),
                    InternalTransfer.destination_location_id.in_(loc_sub),
                )
            )

        # Total count
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total_result = await self.db.execute(count_stmt)
        total_count = total_result.scalar() or 0

        # Sort
        if sort_by == "transfer_number":
            sort_col = InternalTransfer.transfer_number
        elif sort_by == "status":
            sort_col = InternalTransfer.status
        else:
            sort_col = InternalTransfer.created_at

        if sort_order.lower() == "asc":
            stmt = stmt.order_by(asc(sort_col))
        else:
            stmt = stmt.order_by(desc(sort_col))

        # Pagination
        offset = (page - 1) * page_size
        stmt = stmt.offset(offset).limit(page_size)

        result = await self.db.execute(stmt)
        return list(result.scalars().all()), total_count
