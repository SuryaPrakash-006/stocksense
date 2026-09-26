import uuid
from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.models.adjustment import InventoryAdjustment
from app.models.delivery import DeliveryOrder
from app.models.enums import AdjustmentStatus, DocumentStatus
from app.models.product import Product, ProductCategory
from app.models.receipt import Receipt
from app.models.stock import StockBalance, StockLedger
from app.models.transfer import InternalTransfer
from app.models.warehouse import Location, Warehouse
from app.schemas.dashboard import (
    CategoryStockBreakdown,
    DashboardKPICards,
    DashboardOverviewResponse,
    LowStockItem,
    PendingOperationsSummary,
    RecentActivityItem,
    WarehouseStockBreakdown,
)


class DashboardService:
    @staticmethod
    async def get_overview(
        db: AsyncSession,
        warehouse_id: Optional[uuid.UUID] = None,
        location_id: Optional[uuid.UUID] = None,
        category_id: Optional[uuid.UUID] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> DashboardOverviewResponse:
        # 1. Base Stock Balance Subquery with optional warehouse/location filtering
        bal_query = select(
            StockBalance.product_id,
            func.coalesce(func.sum(StockBalance.quantity), 0).label("total_stock"),
        )
        if location_id:
            bal_query = bal_query.where(StockBalance.location_id == location_id)
        elif warehouse_id:
            bal_query = bal_query.join(Location, StockBalance.location_id == Location.id).where(
                Location.warehouse_id == warehouse_id
            )

        bal_subq = bal_query.group_by(StockBalance.product_id).subquery()

        # 2. Product Query with stock joins and category filter
        prod_query = (
            select(
                Product.id,
                Product.name,
                Product.sku,
                Product.unit_of_measure,
                Product.reorder_level,
                ProductCategory.name.label("category_name"),
                func.coalesce(bal_subq.c.total_stock, 0).label("stock"),
            )
            .outerjoin(ProductCategory, Product.category_id == ProductCategory.id)
            .outerjoin(bal_subq, Product.id == bal_subq.c.product_id)
            .where(Product.is_active == True)
        )

        if category_id:
            prod_query = prod_query.where(Product.category_id == category_id)

        prod_res = await db.execute(prod_query)
        prod_rows = prod_res.all()

        products_in_stock_count = 0
        total_units_in_stock = Decimal("0.0000")
        low_stock_count = 0
        out_of_stock_count = 0
        low_stock_list: List[LowStockItem] = []

        for r in prod_rows:
            stk = Decimal(str(r[6]))
            reorder = Decimal(str(r[4]))
            total_units_in_stock += stk

            if stk > Decimal("0.0000"):
                products_in_stock_count += 1

            if stk <= Decimal("0.0000"):
                out_of_stock_count += 1
                deficit = reorder if reorder > Decimal("0.0000") else Decimal("0.0000")
                low_stock_list.append(
                    LowStockItem(
                        product_id=r[0],
                        product_name=r[1],
                        sku=r[2],
                        category_name=r[5],
                        unit_of_measure=r[3],
                        current_stock=stk,
                        reorder_level=reorder,
                        deficit=deficit,
                        status="OUT_OF_STOCK",
                    )
                )
            elif stk <= reorder:
                low_stock_count += 1
                deficit = reorder - stk
                low_stock_list.append(
                    LowStockItem(
                        product_id=r[0],
                        product_name=r[1],
                        sku=r[2],
                        category_name=r[5],
                        unit_of_measure=r[3],
                        current_stock=stk,
                        reorder_level=reorder,
                        deficit=deficit,
                        status="LOW_STOCK",
                    )
                )

        # Sort low stock list: out of stock first, then highest deficit
        low_stock_list.sort(key=lambda x: (x.status != "OUT_OF_STOCK", -float(x.deficit)))

        # 3. Pending Operations Count & Breakdown
        # Receipts Breakdown
        rec_base = select(Receipt.status, func.count(Receipt.id))
        if location_id:
            rec_base = rec_base.where(Receipt.destination_location_id == location_id)
        elif warehouse_id:
            rec_base = rec_base.join(Location, Receipt.destination_location_id == Location.id).where(
                Location.warehouse_id == warehouse_id
            )
        if start_date:
            rec_base = rec_base.where(Receipt.created_at >= start_date)
        if end_date:
            rec_base = rec_base.where(Receipt.created_at <= end_date)

        rec_counts_res = await db.execute(rec_base.group_by(Receipt.status))
        rec_status_map = {row[0]: row[1] for row in rec_counts_res.all()}

        rec_draft = rec_status_map.get(DocumentStatus.DRAFT, 0)
        rec_waiting = rec_status_map.get(DocumentStatus.WAITING, 0)
        rec_ready = rec_status_map.get(DocumentStatus.READY, 0)
        pending_receipts = rec_draft + rec_waiting + rec_ready

        # Deliveries Breakdown
        del_base = select(DeliveryOrder.status, func.count(DeliveryOrder.id))
        if location_id:
            del_base = del_base.where(DeliveryOrder.source_location_id == location_id)
        elif warehouse_id:
            del_base = del_base.join(Location, DeliveryOrder.source_location_id == Location.id).where(
                Location.warehouse_id == warehouse_id
            )
        if start_date:
            del_base = del_base.where(DeliveryOrder.created_at >= start_date)
        if end_date:
            del_base = del_base.where(DeliveryOrder.created_at <= end_date)

        del_counts_res = await db.execute(del_base.group_by(DeliveryOrder.status))
        del_status_map = {row[0]: row[1] for row in del_counts_res.all()}

        del_draft = del_status_map.get(DocumentStatus.DRAFT, 0)
        del_waiting = del_status_map.get(DocumentStatus.WAITING, 0)
        del_ready = del_status_map.get(DocumentStatus.READY, 0)
        pending_deliveries = del_draft + del_waiting + del_ready

        # Transfers Breakdown
        trf_base = select(InternalTransfer.status, func.count(InternalTransfer.id))
        if location_id:
            trf_base = trf_base.where(
                (InternalTransfer.source_location_id == location_id)
                | (InternalTransfer.destination_location_id == location_id)
            )
        elif warehouse_id:
            trf_base = trf_base.join(Location, InternalTransfer.source_location_id == Location.id).where(
                Location.warehouse_id == warehouse_id
            )
        if start_date:
            trf_base = trf_base.where(InternalTransfer.created_at >= start_date)
        if end_date:
            trf_base = trf_base.where(InternalTransfer.created_at <= end_date)

        trf_counts_res = await db.execute(trf_base.group_by(InternalTransfer.status))
        trf_status_map = {row[0]: row[1] for row in trf_counts_res.all()}

        trf_draft = trf_status_map.get(DocumentStatus.DRAFT, 0)
        trf_ready = trf_status_map.get(DocumentStatus.READY, 0)
        scheduled_transfers = trf_draft + trf_ready

        # Adjustments Count
        adj_base = select(func.count(InventoryAdjustment.id)).where(
            InventoryAdjustment.status == AdjustmentStatus.DRAFT
        )
        if location_id:
            adj_base = adj_base.where(InventoryAdjustment.location_id == location_id)
        elif warehouse_id:
            adj_base = adj_base.join(Location, InventoryAdjustment.location_id == Location.id).where(
                Location.warehouse_id == warehouse_id
            )
        adj_res = await db.execute(adj_base)
        pending_adjustments = adj_res.scalar_one()

        kpis = DashboardKPICards(
            total_products_in_stock=products_in_stock_count,
            total_units_in_stock=total_units_in_stock,
            low_stock_items=low_stock_count,
            out_of_stock_items=out_of_stock_count,
            pending_receipts=pending_receipts,
            pending_deliveries=pending_deliveries,
            scheduled_transfers=scheduled_transfers,
            pending_adjustments=pending_adjustments,
        )

        pending_ops = PendingOperationsSummary(
            receipts_draft=rec_draft,
            receipts_waiting=rec_waiting,
            receipts_ready=rec_ready,
            deliveries_draft=del_draft,
            deliveries_waiting=del_waiting,
            deliveries_ready=del_ready,
            transfers_draft=trf_draft,
            transfers_ready=trf_ready,
        )

        # 4. Category Stock Breakdown
        cat_stmt = (
            select(
                ProductCategory.id,
                ProductCategory.name,
                func.count(func.distinct(Product.id)).label("prod_count"),
                func.coalesce(func.sum(StockBalance.quantity), 0).label("cat_stock"),
            )
            .select_from(ProductCategory)
            .outerjoin(Product, ProductCategory.id == Product.category_id)
            .outerjoin(StockBalance, Product.id == StockBalance.product_id)
        )
        if category_id:
            cat_stmt = cat_stmt.where(ProductCategory.id == category_id)
        if location_id:
            cat_stmt = cat_stmt.where(StockBalance.location_id == location_id)
        elif warehouse_id:
            cat_stmt = cat_stmt.join(Location, StockBalance.location_id == Location.id).where(
                Location.warehouse_id == warehouse_id
            )

        cat_stmt = cat_stmt.group_by(ProductCategory.id, ProductCategory.name).order_by(
            ProductCategory.name.asc()
        )
        cat_res = await db.execute(cat_stmt)
        category_breakdown = [
            CategoryStockBreakdown(
                category_id=r[0],
                category_name=r[1],
                product_count=r[2],
                total_stock=Decimal(str(r[3])),
            )
            for r in cat_res.all()
        ]

        # 5. Warehouse Stock Breakdown
        wh_stmt = (
            select(
                Warehouse.id,
                Warehouse.name,
                Warehouse.code,
                func.count(func.distinct(Location.id)).label("loc_count"),
                func.coalesce(func.sum(StockBalance.quantity), 0).label("wh_stock"),
            )
            .select_from(Warehouse)
            .outerjoin(Location, (Warehouse.id == Location.warehouse_id) & (Location.is_active == True))
            .outerjoin(StockBalance, Location.id == StockBalance.location_id)
            .where(Warehouse.is_active == True)
        )
        if warehouse_id:
            wh_stmt = wh_stmt.where(Warehouse.id == warehouse_id)

        wh_stmt = wh_stmt.group_by(Warehouse.id, Warehouse.name, Warehouse.code).order_by(
            Warehouse.name.asc()
        )
        wh_res = await db.execute(wh_stmt)
        warehouse_breakdown = [
            WarehouseStockBreakdown(
                warehouse_id=r[0],
                warehouse_name=r[1],
                warehouse_code=r[2],
                total_locations=r[3],
                total_stock=Decimal(str(r[4])),
            )
            for r in wh_res.all()
        ]

        # 6. Recent Activity Log (From live immutable Stock Ledger & Documents)
        recent_activity: List[RecentActivityItem] = []

        rec_recent = await db.execute(
            select(Receipt)
            .options(selectinload(Receipt.supplier), selectinload(Receipt.creator))
            .order_by(Receipt.created_at.desc())
            .limit(3)
        )
        for rc in rec_recent.scalars().all():
            sup_name = rc.supplier.name if rc.supplier else "Vendor"
            recent_activity.append(
                RecentActivityItem(
                    id=rc.id,
                    type="RECEIPT",
                    document_number=rc.receipt_number,
                    status=rc.status,
                    summary=f"Inbound from {sup_name}",
                    created_at=rc.created_at.isoformat(),
                    created_by_name=rc.creator.name if rc.creator else None,
                )
            )

        del_recent = await db.execute(
            select(DeliveryOrder)
            .options(selectinload(DeliveryOrder.customer), selectinload(DeliveryOrder.creator))
            .order_by(DeliveryOrder.created_at.desc())
            .limit(3)
        )
        for dl in del_recent.scalars().all():
            cust_name = dl.customer.name if dl.customer else "Customer"
            recent_activity.append(
                RecentActivityItem(
                    id=dl.id,
                    type="DELIVERY",
                    document_number=dl.delivery_number,
                    status=dl.status,
                    summary=f"Outbound for {cust_name}",
                    created_at=dl.created_at.isoformat(),
                    created_by_name=dl.creator.name if dl.creator else None,
                )
            )

        trf_recent = await db.execute(
            select(InternalTransfer)
            .options(
                selectinload(InternalTransfer.source_location),
                selectinload(InternalTransfer.destination_location),
                selectinload(InternalTransfer.creator),
            )
            .order_by(InternalTransfer.created_at.desc())
            .limit(3)
        )
        for tr in trf_recent.scalars().all():
            src_name = tr.source_location.code if tr.source_location else "Src"
            dst_name = tr.destination_location.code if tr.destination_location else "Dst"
            recent_activity.append(
                RecentActivityItem(
                    id=tr.id,
                    type="TRANSFER",
                    document_number=tr.transfer_number,
                    status=tr.status,
                    summary=f"Relocation {src_name} → {dst_name}",
                    created_at=tr.created_at.isoformat(),
                    created_by_name=tr.creator.name if tr.creator else None,
                )
            )

        recent_activity.sort(key=lambda a: a.created_at, reverse=True)
        recent_activity = recent_activity[:8]

        return DashboardOverviewResponse(
            kpis=kpis,
            pending_operations=pending_ops,
            low_stock_list=low_stock_list[:10],
            category_breakdown=category_breakdown,
            warehouse_breakdown=warehouse_breakdown,
            recent_activity=recent_activity,
        )
