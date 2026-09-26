import uuid
from decimal import Decimal
from typing import List, Optional, Tuple
from sqlalchemy import asc, desc, func, or_, select, update, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload, joinedload
from app.models.enums import TransactionType
from app.models.product import Product, ProductCategory
from app.models.stock import StockBalance, StockLedger
from app.models.warehouse import Location, Warehouse
from app.models.user import User
from app.repositories.base import BaseRepository
from app.schemas.product import (
    ProductLocationStock,
    ProductStockMovement,
    StockStatus,
)


class CategoryRepository(BaseRepository[ProductCategory]):
    def __init__(self, db: AsyncSession):
        super().__init__(ProductCategory, db)

    async def get_all_with_counts(self) -> List[Tuple[ProductCategory, int]]:
        stmt = (
            select(ProductCategory, func.count(Product.id).label("product_count"))
            .outerjoin(Product, (Product.category_id == ProductCategory.id) & (Product.is_active == True))
            .group_by(ProductCategory.id)
            .order_by(ProductCategory.name.asc())
        )
        result = await self.db.execute(stmt)
        return [(row[0], row[1]) for row in result.all()]

    async def get_by_name(self, name: str) -> Optional[ProductCategory]:
        stmt = select(ProductCategory).where(
            func.lower(ProductCategory.name) == name.strip().lower()
        )
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def create_category(
        self, name: str, code: Optional[str] = None, description: Optional[str] = None
    ) -> ProductCategory:
        cat = ProductCategory(
            name=name.strip(),
            code=code.strip().upper() if code else None,
            description=description.strip() if description else None,
        )
        self.db.add(cat)
        await self.db.commit()
        await self.db.refresh(cat)
        return cat

    async def update_category(
        self,
        category: ProductCategory,
        name: Optional[str] = None,
        code: Optional[str] = None,
        description: Optional[str] = None,
    ) -> ProductCategory:
        if name is not None:
            category.name = name.strip()
        if code is not None:
            category.code = code.strip().upper() if code else None
        if description is not None:
            category.description = description.strip() if description else None
        await self.db.commit()
        await self.db.refresh(category)
        return category


class ProductRepository(BaseRepository[Product]):
    def __init__(self, db: AsyncSession):
        super().__init__(Product, db)

    async def get_by_sku(self, sku: str) -> Optional[Product]:
        stmt = (
            select(Product)
            .where(func.lower(Product.sku) == sku.strip().lower())
            .options(selectinload(Product.category))
        )
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def get_with_relations(self, product_id: uuid.UUID) -> Optional[Product]:
        stmt = (
            select(Product)
            .where(Product.id == product_id)
            .options(selectinload(Product.category))
        )
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def get_location_stocks(self, product_id: uuid.UUID) -> List[ProductLocationStock]:
        stmt = (
            select(
                StockBalance.quantity,
                Location.id.label("loc_id"),
                Location.name.label("loc_name"),
                Location.code.label("loc_code"),
                Location.location_type.label("loc_type"),
                Warehouse.id.label("wh_id"),
                Warehouse.name.label("wh_name"),
                Warehouse.code.label("wh_code"),
            )
            .join(Location, StockBalance.location_id == Location.id)
            .join(Warehouse, Location.warehouse_id == Warehouse.id)
            .where(StockBalance.product_id == product_id)
            .order_by(Warehouse.name.asc(), Location.name.asc())
        )
        result = await self.db.execute(stmt)
        rows = result.all()
        return [
            ProductLocationStock(
                location_id=r.loc_id,
                location_name=r.loc_name,
                location_code=r.loc_code,
                location_type=str(r.loc_type),
                warehouse_id=r.wh_id,
                warehouse_name=r.wh_name,
                warehouse_code=r.wh_code,
                quantity=Decimal(str(r.quantity)),
            )
            for r in rows
        ]

    async def get_recent_movements(
        self, product_id: uuid.UUID, limit: int = 50
    ) -> List[ProductStockMovement]:
        stmt = (
            select(
                StockLedger,
                Location.name.label("loc_name"),
                Location.code.label("loc_code"),
                Warehouse.name.label("wh_name"),
                User.name.label("user_name"),
            )
            .join(Location, StockLedger.location_id == Location.id)
            .join(Warehouse, Location.warehouse_id == Warehouse.id)
            .outerjoin(User, StockLedger.created_by == User.id)
            .where(StockLedger.product_id == product_id)
            .order_by(StockLedger.created_at.desc())
            .limit(limit)
        )
        result = await self.db.execute(stmt)
        rows = result.all()
        return [
            ProductStockMovement(
                id=r[0].id,
                created_at=r[0].created_at,
                transaction_type=r[0].transaction_type,
                reference_type=r[0].reference_type,
                reference_id=r[0].reference_id,
                location_name=r.loc_name,
                location_code=r.loc_code,
                warehouse_name=r.wh_name,
                quantity_before=r[0].quantity_before,
                quantity_change=r[0].quantity_change,
                quantity_after=r[0].quantity_after,
                created_by_name=r.user_name,
            )
            for r in rows
        ]

    async def list_products(
        self,
        search: Optional[str] = None,
        category_id: Optional[uuid.UUID] = None,
        warehouse_id: Optional[uuid.UUID] = None,
        location_id: Optional[uuid.UUID] = None,
        stock_status: StockStatus = StockStatus.ALL,
        page: int = 1,
        page_size: int = 20,
        sort_by: str = "created_at",
        sort_order: str = "desc",
    ) -> Tuple[List[Tuple[Product, Decimal]], int]:
        # Subquery to aggregate total stock balance per product
        stock_subquery = (
            select(
                StockBalance.product_id,
                func.coalesce(func.sum(StockBalance.quantity), Decimal("0.0000")).label("total_stock"),
            )
        )
        if location_id:
            stock_subquery = stock_subquery.where(StockBalance.location_id == location_id)
        elif warehouse_id:
            stock_subquery = stock_subquery.join(
                Location, StockBalance.location_id == Location.id
            ).where(Location.warehouse_id == warehouse_id)

        stock_subquery = stock_subquery.group_by(StockBalance.product_id).subquery()

        # Base query joining Product with stock sum
        stmt = (
            select(
                Product,
                func.coalesce(stock_subquery.c.total_stock, Decimal("0.0000")).label("stock_qty"),
            )
            .outerjoin(stock_subquery, Product.id == stock_subquery.c.product_id)
            .options(selectinload(Product.category))
            .where(Product.is_active == True)
        )

        # Apply search filter
        if search:
            pattern = f"%{search.strip().lower()}%"
            stmt = stmt.where(
                or_(
                    func.lower(Product.name).like(pattern),
                    func.lower(Product.sku).like(pattern),
                )
            )

        # Apply category filter
        if category_id:
            stmt = stmt.where(Product.category_id == category_id)

        # Apply stock status filter
        if stock_status == StockStatus.IN_STOCK:
            stmt = stmt.where(func.coalesce(stock_subquery.c.total_stock, Decimal("0.0000")) > Product.reorder_level)
        elif stock_status == StockStatus.LOW_STOCK:
            stmt = stmt.where(
                (func.coalesce(stock_subquery.c.total_stock, Decimal("0.0000")) <= Product.reorder_level)
                & (func.coalesce(stock_subquery.c.total_stock, Decimal("0.0000")) > Decimal("0.0000"))
            )
        elif stock_status == StockStatus.OUT_OF_STOCK:
            stmt = stmt.where(func.coalesce(stock_subquery.c.total_stock, Decimal("0.0000")) <= Decimal("0.0000"))

        # Total count query
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total_result = await self.db.execute(count_stmt)
        total_count = total_result.scalar() or 0

        # Sorting
        if sort_by == "name":
            sort_col = Product.name
        elif sort_by == "sku":
            sort_col = Product.sku
        elif sort_by == "stock":
            sort_col = func.coalesce(stock_subquery.c.total_stock, Decimal("0.0000"))
        elif sort_by == "reorder_level":
            sort_col = Product.reorder_level
        else:
            sort_col = Product.created_at

        if sort_order.lower() == "asc":
            stmt = stmt.order_by(asc(sort_col))
        else:
            stmt = stmt.order_by(desc(sort_col))

        # Pagination
        offset = (page - 1) * page_size
        stmt = stmt.offset(offset).limit(page_size)

        result = await self.db.execute(stmt)
        rows = result.all()
        return [(r[0], Decimal(str(r[1]))) for r in rows], total_count
