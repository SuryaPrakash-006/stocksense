import uuid
from datetime import datetime
from typing import List, Optional, Tuple
from sqlalchemy import asc, desc, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.models.enums import TransactionType
from app.models.product import Product
from app.models.stock import StockBalance, StockLedger
from app.models.warehouse import Location, Warehouse
from app.models.user import User
from app.repositories.base import BaseRepository
from app.schemas.stock import StockLedgerResponse


class StockRepository(BaseRepository[StockBalance]):
    def __init__(self, db: AsyncSession):
        super().__init__(StockBalance, db)

    async def get_ledger_by_id(self, ledger_id: uuid.UUID) -> Optional[StockLedgerResponse]:
        stmt = (
            select(
                StockLedger,
                Product.name.label("prod_name"),
                Product.sku.label("prod_sku"),
                Product.unit_of_measure.label("prod_uom"),
                Location.name.label("loc_name"),
                Location.code.label("loc_code"),
                Warehouse.name.label("wh_name"),
                User.name.label("user_name"),
            )
            .join(Product, StockLedger.product_id == Product.id)
            .join(Location, StockLedger.location_id == Location.id)
            .join(Warehouse, Location.warehouse_id == Warehouse.id)
            .outerjoin(User, StockLedger.created_by == User.id)
            .where(StockLedger.id == ledger_id)
        )
        res = await self.db.execute(stmt)
        row = res.first()
        if not row:
            return None

        return StockLedgerResponse(
            id=row[0].id,
            product_id=row[0].product_id,
            location_id=row[0].location_id,
            transaction_type=row[0].transaction_type,
            reference_type=row[0].reference_type,
            reference_id=row[0].reference_id,
            quantity_before=row[0].quantity_before,
            quantity_change=row[0].quantity_change,
            quantity_after=row[0].quantity_after,
            created_by=row[0].created_by,
            created_at=row[0].created_at,
            product_name=row.prod_name,
            product_sku=row.prod_sku,
            unit_of_measure=row.prod_uom,
            location_name=row.loc_name,
            location_code=row.loc_code,
            warehouse_name=row.wh_name,
            created_by_name=row.user_name,
        )

    async def list_ledger(
        self,
        product_id: Optional[uuid.UUID] = None,
        sku: Optional[str] = None,
        location_id: Optional[uuid.UUID] = None,
        warehouse_id: Optional[uuid.UUID] = None,
        transaction_type: Optional[TransactionType] = None,
        created_by: Optional[uuid.UUID] = None,
        search: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        page: int = 1,
        page_size: int = 25,
        sort_by: str = "created_at",
        sort_order: str = "desc",
    ) -> Tuple[List[StockLedgerResponse], int]:
        stmt = (
            select(
                StockLedger,
                Product.name.label("prod_name"),
                Product.sku.label("prod_sku"),
                Product.unit_of_measure.label("prod_uom"),
                Location.name.label("loc_name"),
                Location.code.label("loc_code"),
                Warehouse.name.label("wh_name"),
                User.name.label("user_name"),
            )
            .join(Product, StockLedger.product_id == Product.id)
            .join(Location, StockLedger.location_id == Location.id)
            .join(Warehouse, Location.warehouse_id == Warehouse.id)
            .outerjoin(User, StockLedger.created_by == User.id)
        )

        if product_id:
            stmt = stmt.where(StockLedger.product_id == product_id)
        if sku:
            stmt = stmt.where(func.lower(Product.sku) == sku.strip().lower())
        if location_id:
            stmt = stmt.where(StockLedger.location_id == location_id)
        elif warehouse_id:
            stmt = stmt.where(Location.warehouse_id == warehouse_id)

        if transaction_type:
            stmt = stmt.where(StockLedger.transaction_type == transaction_type)
        if created_by:
            stmt = stmt.where(StockLedger.created_by == created_by)

        if search:
            pattern = f"%{search.strip().lower()}%"
            stmt = stmt.where(
                or_(
                    func.lower(Product.name).like(pattern),
                    func.lower(Product.sku).like(pattern),
                    func.lower(StockLedger.reference_type).like(pattern),
                    func.lower(Location.name).like(pattern),
                    func.lower(Warehouse.name).like(pattern),
                    func.lower(User.name).like(pattern),
                )
            )

        if start_date:
            stmt = stmt.where(StockLedger.created_at >= start_date)
        if end_date:
            stmt = stmt.where(StockLedger.created_at <= end_date)

        # Count total
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total_result = await self.db.execute(count_stmt)
        total_count = total_result.scalar() or 0

        # Sort field
        is_asc = sort_order.lower() == "asc"
        if sort_by == "product_name":
            stmt = stmt.order_by(asc(Product.name) if is_asc else desc(Product.name))
        elif sort_by == "quantity_change":
            stmt = stmt.order_by(asc(StockLedger.quantity_change) if is_asc else desc(StockLedger.quantity_change))
        elif sort_by == "quantity_after":
            stmt = stmt.order_by(asc(StockLedger.quantity_after) if is_asc else desc(StockLedger.quantity_after))
        elif sort_by == "transaction_type":
            stmt = stmt.order_by(asc(StockLedger.transaction_type) if is_asc else desc(StockLedger.transaction_type))
        else:
            stmt = stmt.order_by(asc(StockLedger.created_at) if is_asc else desc(StockLedger.created_at))

        # Pagination
        offset = (page - 1) * page_size
        stmt = stmt.offset(offset).limit(page_size)

        result = await self.db.execute(stmt)
        rows = result.all()

        responses = [
            StockLedgerResponse(
                id=r[0].id,
                product_id=r[0].product_id,
                location_id=r[0].location_id,
                transaction_type=r[0].transaction_type,
                reference_type=r[0].reference_type,
                reference_id=r[0].reference_id,
                quantity_before=r[0].quantity_before,
                quantity_change=r[0].quantity_change,
                quantity_after=r[0].quantity_after,
                created_by=r[0].created_by,
                created_at=r[0].created_at,
                product_name=r.prod_name,
                product_sku=r.prod_sku,
                unit_of_measure=r.prod_uom,
                location_name=r.loc_name,
                location_code=r.loc_code,
                warehouse_name=r.wh_name,
                created_by_name=r.user_name,
            )
            for r in rows
        ]
        return responses, total_count

