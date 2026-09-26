from decimal import Decimal
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel


class DashboardKPICards(BaseModel):
    total_products_in_stock: int = 0
    total_units_in_stock: Decimal = Decimal("0.0000")
    low_stock_items: int = 0
    out_of_stock_items: int = 0
    pending_receipts: int = 0
    pending_deliveries: int = 0
    scheduled_transfers: int = 0
    pending_adjustments: int = 0


class CategoryStockBreakdown(BaseModel):
    category_id: Optional[UUID] = None
    category_name: str
    product_count: int
    total_stock: Decimal


class WarehouseStockBreakdown(BaseModel):
    warehouse_id: UUID
    warehouse_name: str
    warehouse_code: str
    total_locations: int
    total_stock: Decimal


class LowStockItem(BaseModel):
    product_id: UUID
    product_name: str
    sku: str
    category_name: Optional[str] = None
    unit_of_measure: str
    current_stock: Decimal
    reorder_level: Decimal
    deficit: Decimal
    status: str  # "OUT_OF_STOCK" | "LOW_STOCK"


class PendingOperationsSummary(BaseModel):
    receipts_draft: int = 0
    receipts_waiting: int = 0
    receipts_ready: int = 0
    deliveries_draft: int = 0
    deliveries_waiting: int = 0
    deliveries_ready: int = 0
    transfers_draft: int = 0
    transfers_ready: int = 0


class RecentActivityItem(BaseModel):
    id: UUID
    type: str  # "RECEIPT", "DELIVERY", "TRANSFER", "ADJUSTMENT"
    document_number: str
    status: str
    summary: str
    created_at: str
    created_by_name: Optional[str] = None


class DashboardOverviewResponse(BaseModel):
    kpis: DashboardKPICards
    pending_operations: PendingOperationsSummary
    low_stock_list: List[LowStockItem] = []
    category_breakdown: List[CategoryStockBreakdown] = []
    warehouse_breakdown: List[WarehouseStockBreakdown] = []
    recent_activity: List[RecentActivityItem] = []
