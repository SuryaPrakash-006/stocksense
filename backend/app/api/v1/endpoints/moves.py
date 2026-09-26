import uuid
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.enums import TransactionType
from app.models.user import User
from app.schemas.stock import StockLedgerPaginationResponse, StockMovesStatsResponse
from app.services.transfer import StockLedgerService

router = APIRouter()


@router.get(
    "/stats",
    response_model=StockMovesStatsResponse,
    status_code=status.HTTP_200_OK,
    summary="Get aggregated stock movement statistics",
)
async def get_moves_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> StockMovesStatsResponse:
    return await StockLedgerService.get_moves_stats(db=db)


@router.get(
    "",
    response_model=StockLedgerPaginationResponse,
    status_code=status.HTTP_200_OK,
    summary="List immutable stock movement ledger audit trail",
    description="Returns chronological move history across receipts, deliveries, internal transfers, and physical inventory adjustments.",
)
async def list_moves(
    product_id: Optional[uuid.UUID] = Query(None, description="Filter by Product ID"),
    location_id: Optional[uuid.UUID] = Query(None, description="Filter by Location ID"),
    warehouse_id: Optional[uuid.UUID] = Query(None, description="Filter by Warehouse ID"),
    transaction_type: Optional[TransactionType] = Query(None, description="Filter by transaction type"),
    search: Optional[str] = Query(None, description="Search by product name, SKU, or reference type"),
    start_date: Optional[datetime] = Query(None, description="Filter moves on or after this timestamp"),
    end_date: Optional[datetime] = Query(None, description="Filter moves on or before this timestamp"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(25, ge=1, le=100, description="Items per page"),
    sort_order: str = Query("desc", description="Sort order: asc or desc"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> StockLedgerPaginationResponse:
    return await StockLedgerService.list_moves(
        db=db,
        product_id=product_id,
        location_id=location_id,
        warehouse_id=warehouse_id,
        transaction_type=transaction_type,
        search=search,
        start_date=start_date,
        end_date=end_date,
        page=page,
        page_size=page_size,
        sort_order=sort_order,
    )
