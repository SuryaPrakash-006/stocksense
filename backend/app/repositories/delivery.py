import uuid
from typing import List, Optional, Tuple
from sqlalchemy import asc, desc, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.models.delivery import DeliveryItem, DeliveryOrder
from app.models.enums import DocumentStatus
from app.models.partner import Customer
from app.models.product import Product
from app.models.warehouse import Location, Warehouse
from app.models.user import User
from app.repositories.base import BaseRepository


class DeliveryRepository(BaseRepository[DeliveryOrder]):
    def __init__(self, db: AsyncSession):
        super().__init__(DeliveryOrder, db)

    async def get_by_id_with_relations(
        self, delivery_id: uuid.UUID
    ) -> Optional[DeliveryOrder]:
        stmt = (
            select(DeliveryOrder)
            .where(DeliveryOrder.id == delivery_id)
            .options(
                selectinload(DeliveryOrder.customer),
                selectinload(DeliveryOrder.source_location).selectinload(Location.warehouse),
                selectinload(DeliveryOrder.creator),
                selectinload(DeliveryOrder.validator),
                selectinload(DeliveryOrder.items)
                .selectinload(DeliveryItem.product)
                .selectinload(Product.category),
            )
        )
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def get_by_number(self, delivery_number: str) -> Optional[DeliveryOrder]:
        stmt = select(DeliveryOrder).where(
            func.lower(DeliveryOrder.delivery_number) == delivery_number.strip().lower()
        )
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def list_deliveries(
        self,
        search: Optional[str] = None,
        status: Optional[DocumentStatus] = None,
        customer_id: Optional[uuid.UUID] = None,
        source_location_id: Optional[uuid.UUID] = None,
        warehouse_id: Optional[uuid.UUID] = None,
        page: int = 1,
        page_size: int = 20,
        sort_by: str = "created_at",
        sort_order: str = "desc",
    ) -> Tuple[List[DeliveryOrder], int]:
        stmt = (
            select(DeliveryOrder)
            .options(
                selectinload(DeliveryOrder.customer),
                selectinload(DeliveryOrder.source_location).selectinload(Location.warehouse),
                selectinload(DeliveryOrder.creator),
                selectinload(DeliveryOrder.validator),
                selectinload(DeliveryOrder.items).selectinload(DeliveryItem.product),
            )
        )

        if search:
            pattern = f"%{search.strip().lower()}%"
            stmt = stmt.outerjoin(Customer, DeliveryOrder.customer_id == Customer.id).where(
                or_(
                    func.lower(DeliveryOrder.delivery_number).like(pattern),
                    func.lower(Customer.name).like(pattern),
                )
            )

        if status:
            stmt = stmt.where(DeliveryOrder.status == status)

        if customer_id:
            stmt = stmt.where(DeliveryOrder.customer_id == customer_id)

        if source_location_id:
            stmt = stmt.where(DeliveryOrder.source_location_id == source_location_id)
        elif warehouse_id:
            stmt = stmt.join(
                Location, DeliveryOrder.source_location_id == Location.id
            ).where(Location.warehouse_id == warehouse_id)

        # Count total
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total_result = await self.db.execute(count_stmt)
        total_count = total_result.scalar() or 0

        # Sort
        if sort_by == "delivery_number":
            sort_col = DeliveryOrder.delivery_number
        elif sort_by == "status":
            sort_col = DeliveryOrder.status
        else:
            sort_col = DeliveryOrder.created_at

        if sort_order.lower() == "asc":
            stmt = stmt.order_by(asc(sort_col))
        else:
            stmt = stmt.order_by(desc(sort_col))

        # Pagination
        offset = (page - 1) * page_size
        stmt = stmt.offset(offset).limit(page_size)

        result = await self.db.execute(stmt)
        return list(result.scalars().all()), total_count
