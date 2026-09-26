import uuid
from decimal import Decimal
from typing import List, Optional, Tuple
from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.product import Product, ProductCategory
from app.models.stock import StockBalance
from app.models.warehouse import Location, Warehouse
from app.schemas.alert import (
    AlertSeverityEnum,
    StockAlertItem,
    StockAlertPaginationResponse,
    StockAlertSummary,
    StockStatusEnum,
)


class AlertService:
    @staticmethod
    def _evaluate_item(
        product: Product,
        location: Optional[Location],
        warehouse: Optional[Warehouse],
        quantity: Decimal,
        balance_id: Optional[uuid.UUID] = None,
        updated_at=None,
    ) -> StockAlertItem:
        reorder_level = product.reorder_level or Decimal("0.0000")
        unit = product.unit_of_measure or "Units"
        loc_name = location.name if location else "Unallocated / Global"
        loc_code = location.code if location else None
        wh_name = warehouse.name if warehouse else (location.warehouse.name if location and location.warehouse else None)
        wh_code = warehouse.code if warehouse else (location.warehouse.code if location and location.warehouse else None)

        if quantity <= Decimal("0.0000"):
            status = StockStatusEnum.OUT_OF_STOCK
            severity = AlertSeverityEnum.CRITICAL
            deficit = max(Decimal("0.0000"), reorder_level - quantity) if reorder_level > 0 else Decimal("0.0000")
            msg = (
                f"Critical Shortage: '{product.name}' (SKU: {product.sku}) is completely out of stock at {loc_name}."
                if location
                else f"Critical Shortage: '{product.name}' (SKU: {product.sku}) has zero recorded inventory across all locations."
            )
        elif quantity <= reorder_level:
            status = StockStatusEnum.LOW_STOCK
            severity = AlertSeverityEnum.WARNING
            deficit = max(Decimal("0.0000"), reorder_level - quantity)
            msg = (
                f"Low Stock Alert: '{product.name}' (SKU: {product.sku}) at {loc_name} has {quantity:g} {unit} remaining, "
                f"which is below the threshold of {reorder_level:g} {unit}."
            )
        else:
            status = StockStatusEnum.IN_STOCK
            severity = AlertSeverityEnum.INFO
            deficit = Decimal("0.0000")
            msg = f"Stock level healthy: '{product.name}' has {quantity:g} {unit} at {loc_name}."

        item_id = str(balance_id) if balance_id else f"{product.id}:{location.id if location else 'none'}"

        return StockAlertItem(
            id=item_id,
            product_id=product.id,
            product_name=product.name,
            product_sku=product.sku,
            category_id=product.category_id,
            category_name=product.category.name if product.category else None,
            unit_of_measure=unit,
            location_id=location.id if location else None,
            location_name=loc_name if location else None,
            location_code=loc_code,
            warehouse_id=warehouse.id if warehouse else (location.warehouse_id if location else None),
            warehouse_name=wh_name,
            warehouse_code=wh_code,
            current_quantity=quantity,
            reorder_level=reorder_level,
            deficit_quantity=deficit,
            status=status,
            severity=severity,
            message=msg,
            last_updated=updated_at or product.updated_at,
        )

    @classmethod
    async def get_summary(
        cls,
        db: AsyncSession,
        warehouse_id: Optional[uuid.UUID] = None,
        location_id: Optional[uuid.UUID] = None,
        category_id: Optional[uuid.UUID] = None,
    ) -> StockAlertSummary:
        # Query 1: Stock balances with products and locations
        stmt = (
            select(StockBalance, Product)
            .join(Product, StockBalance.product_id == Product.id)
            .join(Location, StockBalance.location_id == Location.id)
            .where(Product.is_active == True)
        )
        if location_id:
            stmt = stmt.where(StockBalance.location_id == location_id)
        elif warehouse_id:
            stmt = stmt.where(Location.warehouse_id == warehouse_id)
        if category_id:
            stmt = stmt.where(Product.category_id == category_id)

        result = await db.execute(stmt)
        balances_and_prods = result.all()

        low_stock_count = 0
        out_of_stock_count = 0
        in_stock_count = 0
        products_with_balances = set()

        for bal, prod in balances_and_prods:
            products_with_balances.add(prod.id)
            qty = bal.quantity or Decimal("0.0000")
            reorder = prod.reorder_level or Decimal("0.0000")
            if qty <= Decimal("0.0000"):
                out_of_stock_count += 1
            elif qty <= reorder:
                low_stock_count += 1
            else:
                in_stock_count += 1

        # Query 2: Active products without any stock balance records (if not filtering on specific location)
        if not location_id and not warehouse_id:
            untracked_stmt = select(Product).where(
                and_(
                    Product.is_active == True,
                    ~Product.id.in_(products_with_balances) if products_with_balances else True,
                )
            )
            if category_id:
                untracked_stmt = untracked_stmt.where(Product.category_id == category_id)
            untracked_prods = (await db.execute(untracked_stmt)).scalars().all()
            out_of_stock_count += len(untracked_prods)

        total_alerts = low_stock_count + out_of_stock_count

        return StockAlertSummary(
            total_alerts=total_alerts,
            low_stock_count=low_stock_count,
            out_of_stock_count=out_of_stock_count,
            in_stock_count=in_stock_count,
            critical_count=out_of_stock_count,
            warning_count=low_stock_count,
        )

    @classmethod
    async def get_alerts(
        cls,
        db: AsyncSession,
        status_filter: Optional[str] = None,  # "LOW_STOCK", "OUT_OF_STOCK", "IN_STOCK", "ALL", None (defaults to alerts)
        warehouse_id: Optional[uuid.UUID] = None,
        location_id: Optional[uuid.UUID] = None,
        category_id: Optional[uuid.UUID] = None,
        search: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
        sort_by: str = "deficit",  # deficit, quantity, reorder_level, product_name, location_name
        sort_order: str = "desc",
    ) -> StockAlertPaginationResponse:
        # Load balances with joins
        stmt = (
            select(StockBalance)
            .join(Product, StockBalance.product_id == Product.id)
            .join(Location, StockBalance.location_id == Location.id)
            .outerjoin(Warehouse, Location.warehouse_id == Warehouse.id)
            .outerjoin(ProductCategory, Product.category_id == ProductCategory.id)
            .where(Product.is_active == True)
            .options(
                selectinload(StockBalance.product).selectinload(Product.category),
                selectinload(StockBalance.location).selectinload(Location.warehouse),
            )
        )

        if location_id:
            stmt = stmt.where(StockBalance.location_id == location_id)
        elif warehouse_id:
            stmt = stmt.where(Location.warehouse_id == warehouse_id)
        if category_id:
            stmt = stmt.where(Product.category_id == category_id)

        res = await db.execute(stmt)
        balances = res.scalars().all()

        evaluated_items: List[StockAlertItem] = []
        products_with_balances = set()

        for bal in balances:
            products_with_balances.add(bal.product_id)
            item = cls._evaluate_item(
                product=bal.product,
                location=bal.location,
                warehouse=bal.location.warehouse if bal.location else None,
                quantity=bal.quantity,
                balance_id=bal.id,
                updated_at=bal.updated_at,
            )
            evaluated_items.append(item)

        # Include active products that have no stock balances at all when warehouse/location isn't restricted
        if not location_id and not warehouse_id:
            untracked_stmt = (
                select(Product)
                .outerjoin(ProductCategory, Product.category_id == ProductCategory.id)
                .where(
                    and_(
                        Product.is_active == True,
                        ~Product.id.in_(products_with_balances) if products_with_balances else True,
                    )
                )
                .options(selectinload(Product.category))
            )
            if category_id:
                untracked_stmt = untracked_stmt.where(Product.category_id == category_id)

            untracked_prods = (await db.execute(untracked_stmt)).scalars().all()
            for prod in untracked_prods:
                item = cls._evaluate_item(
                    product=prod,
                    location=None,
                    warehouse=None,
                    quantity=Decimal("0.0000"),
                    balance_id=None,
                    updated_at=prod.updated_at,
                )
                evaluated_items.append(item)

        # Apply status filter
        if status_filter:
            norm_status = status_filter.upper().strip()
            if norm_status in ("LOW_STOCK", "OUT_OF_STOCK", "IN_STOCK"):
                evaluated_items = [i for i in evaluated_items if i.status.value == norm_status]
            elif norm_status in ("ALERTS", "ACTIVE_ALERTS"):
                evaluated_items = [
                    i for i in evaluated_items if i.status.value in ("LOW_STOCK", "OUT_OF_STOCK")
                ]
        else:
            # By default, return all active alerts (LOW_STOCK & OUT_OF_STOCK)
            evaluated_items = [
                i for i in evaluated_items if i.status.value in ("LOW_STOCK", "OUT_OF_STOCK")
            ]

        # Apply search filter
        if search:
            q = search.lower().strip()
            evaluated_items = [
                i
                for i in evaluated_items
                if q in i.product_name.lower()
                or q in i.product_sku.lower()
                or (i.location_name and q in i.location_name.lower())
                or (i.warehouse_name and q in i.warehouse_name.lower())
                or (i.category_name and q in i.category_name.lower())
            ]

        # Sorting
        reverse = sort_order.lower() == "desc"
        if sort_by == "deficit":
            evaluated_items.sort(key=lambda x: (x.severity == AlertSeverityEnum.CRITICAL, x.deficit_quantity), reverse=reverse)
        elif sort_by == "quantity":
            evaluated_items.sort(key=lambda x: x.current_quantity, reverse=reverse)
        elif sort_by == "reorder_level":
            evaluated_items.sort(key=lambda x: x.reorder_level, reverse=reverse)
        elif sort_by == "product_name":
            evaluated_items.sort(key=lambda x: x.product_name.lower(), reverse=reverse)
        elif sort_by == "location_name":
            evaluated_items.sort(key=lambda x: (x.location_name or "").lower(), reverse=reverse)
        else:
            evaluated_items.sort(key=lambda x: (x.severity == AlertSeverityEnum.CRITICAL, x.deficit_quantity), reverse=True)

        # Pagination
        total = len(evaluated_items)
        page = max(1, page)
        page_size = max(1, min(page_size, 100))
        pages = (total + page_size - 1) // page_size if total > 0 else 1
        start_idx = (page - 1) * page_size
        paginated_items = evaluated_items[start_idx : start_idx + page_size]

        summary = await cls.get_summary(
            db=db,
            warehouse_id=warehouse_id,
            location_id=location_id,
            category_id=category_id,
        )

        return StockAlertPaginationResponse(
            items=paginated_items,
            total=total,
            page=page,
            page_size=page_size,
            pages=pages,
            summary=summary,
        )
