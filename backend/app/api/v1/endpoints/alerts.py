import uuid
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.alert import (
    StockAlertPaginationResponse,
    StockAlertSummary,
)
from app.services.alert_service import AlertService

router = APIRouter()


@router.get(
    "/summary",
    response_model=StockAlertSummary,
    summary="Get aggregated stock alert counts and severities",
)
async def get_alerts_summary(
    warehouse_id: Optional[uuid.UUID] = Query(None, description="Filter by warehouse ID"),
    location_id: Optional[uuid.UUID] = Query(None, description="Filter by location ID"),
    category_id: Optional[uuid.UUID] = Query(None, description="Filter by product category ID"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> StockAlertSummary:
    """Returns dynamic counts of low-stock, out-of-stock, and healthy inventory derived from live stock balances."""
    return await AlertService.get_summary(
        db=db,
        warehouse_id=warehouse_id,
        location_id=location_id,
        category_id=category_id,
    )


@router.get(
    "",
    response_model=StockAlertPaginationResponse,
    summary="List all inventory alerts with filtering and pagination",
)
async def list_stock_alerts(
    status: Optional[str] = Query(
        None,
        description="Filter status: LOW_STOCK, OUT_OF_STOCK, IN_STOCK, or ALL (defaults to active alerts)",
    ),
    warehouse_id: Optional[uuid.UUID] = Query(None, description="Filter by warehouse ID"),
    location_id: Optional[uuid.UUID] = Query(None, description="Filter by location ID"),
    category_id: Optional[uuid.UUID] = Query(None, description="Filter by product category ID"),
    search: Optional[str] = Query(None, description="Search product name, SKU, location, or warehouse"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    sort_by: str = Query("deficit", description="Sort by: deficit, quantity, reorder_level, product_name, location_name"),
    sort_order: str = Query("desc", description="Sort order: asc or desc"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> StockAlertPaginationResponse:
    """Lists stock alerts evaluated against product reorder thresholds per location."""
    return await AlertService.get_alerts(
        db=db,
        status_filter=status,
        warehouse_id=warehouse_id,
        location_id=location_id,
        category_id=category_id,
        search=search,
        page=page,
        page_size=page_size,
        sort_by=sort_by,
        sort_order=sort_order,
    )


@router.get(
    "/low-stock",
    response_model=StockAlertPaginationResponse,
    summary="List low stock products and locations",
)
async def list_low_stock_products(
    warehouse_id: Optional[uuid.UUID] = Query(None, description="Filter by warehouse ID"),
    location_id: Optional[uuid.UUID] = Query(None, description="Filter by location ID"),
    category_id: Optional[uuid.UUID] = Query(None, description="Filter by product category ID"),
    search: Optional[str] = Query(None, description="Search product name, SKU, or location"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    sort_by: str = Query("deficit", description="Sort by: deficit, quantity, reorder_level, product_name"),
    sort_order: str = Query("desc", description="Sort order: asc or desc"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> StockAlertPaginationResponse:
    """Returns product/location items where 0 < quantity <= reorder_level."""
    return await AlertService.get_alerts(
        db=db,
        status_filter="LOW_STOCK",
        warehouse_id=warehouse_id,
        location_id=location_id,
        category_id=category_id,
        search=search,
        page=page,
        page_size=page_size,
        sort_by=sort_by,
        sort_order=sort_order,
    )


@router.get(
    "/out-of-stock",
    response_model=StockAlertPaginationResponse,
    summary="List out-of-stock products and locations",
)
async def list_out_of_stock_products(
    warehouse_id: Optional[uuid.UUID] = Query(None, description="Filter by warehouse ID"),
    location_id: Optional[uuid.UUID] = Query(None, description="Filter by location ID"),
    category_id: Optional[uuid.UUID] = Query(None, description="Filter by product category ID"),
    search: Optional[str] = Query(None, description="Search product name, SKU, or location"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    sort_by: str = Query("reorder_level", description="Sort by: reorder_level, product_name, location_name"),
    sort_order: str = Query("desc", description="Sort order: asc or desc"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> StockAlertPaginationResponse:
    """Returns product/location items where quantity <= 0."""
    return await AlertService.get_alerts(
        db=db,
        status_filter="OUT_OF_STOCK",
        warehouse_id=warehouse_id,
        location_id=location_id,
        category_id=category_id,
        search=search,
        page=page,
        page_size=page_size,
        sort_by=sort_by,
        sort_order=sort_order,
    )
