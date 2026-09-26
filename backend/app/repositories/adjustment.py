import uuid
from typing import List, Optional, Tuple
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.models.adjustment import InventoryAdjustment
from app.models.enums import AdjustmentStatus
from app.models.product import Product
from app.models.warehouse import Location


class AdjustmentRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id_with_relations(
        self, adjustment_id: uuid.UUID
    ) -> Optional[InventoryAdjustment]:
        stmt = (
            select(InventoryAdjustment)
            .where(InventoryAdjustment.id == adjustment_id)
            .options(
                selectinload(InventoryAdjustment.product).selectinload(Product.category),
                selectinload(InventoryAdjustment.location).selectinload(Location.warehouse),
                selectinload(InventoryAdjustment.creator),
                selectinload(InventoryAdjustment.validator),
            )
        )
        res = await self.db.execute(stmt)
        return res.scalars().first()

    async def get_by_number(
        self, adjustment_number: str
    ) -> Optional[InventoryAdjustment]:
        stmt = select(InventoryAdjustment).where(
            InventoryAdjustment.adjustment_number == adjustment_number
        )
        res = await self.db.execute(stmt)
        return res.scalars().first()

    async def list_adjustments(
        self,
        search: Optional[str] = None,
        status: Optional[AdjustmentStatus] = None,
        product_id: Optional[uuid.UUID] = None,
        location_id: Optional[uuid.UUID] = None,
        warehouse_id: Optional[uuid.UUID] = None,
        page: int = 1,
        page_size: int = 20,
        sort_by: str = "created_at",
        sort_order: str = "desc",
    ) -> Tuple[List[InventoryAdjustment], int]:
        query = (
            select(InventoryAdjustment)
            .join(InventoryAdjustment.product)
            .join(InventoryAdjustment.location)
            .options(
                selectinload(InventoryAdjustment.product).selectinload(Product.category),
                selectinload(InventoryAdjustment.location).selectinload(Location.warehouse),
                selectinload(InventoryAdjustment.creator),
                selectinload(InventoryAdjustment.validator),
            )
        )

        if status is not None:
            query = query.where(InventoryAdjustment.status == status)

        if product_id is not None:
            query = query.where(InventoryAdjustment.product_id == product_id)

        if location_id is not None:
            query = query.where(InventoryAdjustment.location_id == location_id)

        if warehouse_id is not None:
            query = query.where(Location.warehouse_id == warehouse_id)

        if search and search.strip():
            term = f"%{search.strip()}%"
            query = query.where(
                (InventoryAdjustment.adjustment_number.ilike(term))
                | (Product.name.ilike(term))
                | (Product.sku.ilike(term))
                | (InventoryAdjustment.reason.ilike(term))
            )

        # Count
        count_stmt = select(func.count()).select_from(query.subquery())
        total_res = await self.db.execute(count_stmt)
        total_count = total_res.scalar_one()

        # Sorting
        sort_column = getattr(InventoryAdjustment, sort_by, InventoryAdjustment.created_at)
        if sort_order.lower() == "asc":
            query = query.order_by(sort_column.asc())
        else:
            query = query.order_by(sort_column.desc())

        # Pagination
        offset = (page - 1) * page_size
        query = query.offset(offset).limit(page_size)

        result = await self.db.execute(query)
        return list(result.scalars().all()), total_count
