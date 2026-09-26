from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field


class StockStatusEnum(str, Enum):
    IN_STOCK = "IN_STOCK"
    LOW_STOCK = "LOW_STOCK"
    OUT_OF_STOCK = "OUT_OF_STOCK"


class AlertSeverityEnum(str, Enum):
    CRITICAL = "CRITICAL"
    WARNING = "WARNING"
    INFO = "INFO"


class StockAlertItem(BaseModel):
    id: str
    product_id: UUID
    product_name: str
    product_sku: str
    category_id: Optional[UUID] = None
    category_name: Optional[str] = None
    unit_of_measure: str = "Units"
    location_id: Optional[UUID] = None
    location_name: Optional[str] = None
    location_code: Optional[str] = None
    warehouse_id: Optional[UUID] = None
    warehouse_name: Optional[str] = None
    warehouse_code: Optional[str] = None
    current_quantity: Decimal = Field(default=Decimal("0.0000"))
    reorder_level: Decimal = Field(default=Decimal("0.0000"))
    deficit_quantity: Decimal = Field(default=Decimal("0.0000"))
    status: StockStatusEnum
    severity: AlertSeverityEnum
    message: str
    last_updated: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class StockAlertSummary(BaseModel):
    total_alerts: int = 0
    low_stock_count: int = 0
    out_of_stock_count: int = 0
    in_stock_count: int = 0
    critical_count: int = 0
    warning_count: int = 0


class StockAlertPaginationResponse(BaseModel):
    items: List[StockAlertItem]
    total: int
    page: int
    page_size: int
    pages: int
    summary: Optional[StockAlertSummary] = None
