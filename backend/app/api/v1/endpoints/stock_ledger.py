import uuid
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.enums import TransactionType
from app.models.user import User
from app.schemas.stock import StockLedgerPaginationResponse, StockLedgerResponse, StockMovesStatsResponse
from app.services.transfer import StockLedgerService

router = APIRouter()


@router.get(
    "/stats",
    response_model=StockMovesStatsResponse,
    status_code=status.HTTP_200_OK,
    summary="Get aggregated stock ledger movement statistics",
)
async def get_stock_ledger_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> StockMovesStatsResponse:
    """Returns total immutable transaction counts partitioned by transaction type."""
    return await StockLedgerService.get_moves_stats(db=db)


@router.get(
    "",
    response_model=StockLedgerPaginationResponse,
    status_code=status.HTTP_200_OK,
    summary="List immutable stock ledger audit trail",
    description="Query chronological stock ledger records across receipts, deliveries, transfers, and inventory adjustments with comprehensive filters.",
)
async def list_stock_ledger(
    product: Optional[str] = Query(None, description="Search product name or SKU"),
    product_id: Optional[uuid.UUID] = Query(None, description="Filter by Product ID"),
    sku: Optional[str] = Query(None, description="Filter by exact product SKU"),
    warehouse: Optional[uuid.UUID] = Query(None, description="Filter by Warehouse ID", alias="warehouse_id"),
    location: Optional[uuid.UUID] = Query(None, description="Filter by Location ID", alias="location_id"),
    transaction_type: Optional[TransactionType] = Query(None, description="Filter by transaction type (RECEIPT, DELIVERY, TRANSFER_IN, TRANSFER_OUT, ADJUSTMENT)"),
    user: Optional[uuid.UUID] = Query(None, description="Filter by User ID who performed operation", alias="user_id"),
    start_date: Optional[datetime] = Query(None, description="Filter records on or after this ISO timestamp"),
    end_date: Optional[datetime] = Query(None, description="Filter records on or before this ISO timestamp"),
    search: Optional[str] = Query(None, description="Search across product, SKU, reference type, location, warehouse, or user"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(25, ge=1, le=100, description="Items per page"),
    sort_by: str = Query("created_at", description="Sort field: created_at, product_name, quantity_change, quantity_after, transaction_type"),
    sort_order: str = Query("desc", description="Sort order: asc or desc"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> StockLedgerPaginationResponse:
    """Returns immutable stock ledger entries with pagination, sorting, and multi-field filtering."""
    combined_search = search or product
    return await StockLedgerService.list_moves(
        db=db,
        product_id=product_id,
        sku=sku,
        location_id=location,
        warehouse_id=warehouse,
        transaction_type=transaction_type,
        created_by=user,
        search=combined_search,
        start_date=start_date,
        end_date=end_date,
        page=page,
        page_size=page_size,
        sort_by=sort_by,
        sort_order=sort_order,
    )


@router.get(
    "/{ledger_id}",
    response_model=StockLedgerResponse,
    status_code=status.HTTP_200_OK,
    summary="Get single immutable stock ledger record details",
)
async def get_stock_ledger_entry(
    ledger_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> StockLedgerResponse:
    """Retrieves an individual immutable ledger audit record by its primary key ID."""
    entry = await StockLedgerService.get_ledger_item(db=db, ledger_id=ledger_id)
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Stock ledger entry '{ledger_id}' not found.",
        )
    return entry
