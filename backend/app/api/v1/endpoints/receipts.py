import uuid
from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_current_user, require_warehouse_staff
from app.db.session import get_db
from app.models.enums import DocumentStatus
from app.models.user import User
from app.schemas.receipt import (
    ReceiptCreate,
    ReceiptPaginationResponse,
    ReceiptResponse,
    ReceiptUpdate,
)
from app.services.receipt import ReceiptService

router = APIRouter()


@router.get(
    "",
    response_model=ReceiptPaginationResponse,
    status_code=status.HTTP_200_OK,
    summary="List receipts with filters and pagination",
)
async def list_receipts(
    search: Optional[str] = Query(None, description="Search by receipt number or supplier name"),
    status: Optional[DocumentStatus] = Query(None, description="Filter by status: DRAFT, WAITING, READY, DONE, CANCELED"),
    supplier_id: Optional[uuid.UUID] = Query(None, description="Filter by supplier ID"),
    destination_location_id: Optional[uuid.UUID] = Query(None, description="Filter by destination location ID"),
    warehouse_id: Optional[uuid.UUID] = Query(None, description="Filter by warehouse ID"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    sort_by: str = Query("created_at", description="Field to sort by: created_at, receipt_number, status"),
    sort_order: str = Query("desc", description="Sort order: asc or desc"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ReceiptPaginationResponse:
    return await ReceiptService.list_receipts(
        db=db,
        search=search,
        status_filter=status,
        supplier_id=supplier_id,
        destination_location_id=destination_location_id,
        warehouse_id=warehouse_id,
        page=page,
        page_size=page_size,
        sort_by=sort_by,
        sort_order=sort_order,
    )


@router.post(
    "",
    response_model=ReceiptResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new incoming receipt order",
)
async def create_receipt(
    data: ReceiptCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_warehouse_staff),
) -> ReceiptResponse:
    return await ReceiptService.create_receipt(
        db=db, data=data, current_user=current_user
    )


@router.get(
    "/{receipt_id}",
    response_model=ReceiptResponse,
    status_code=status.HTTP_200_OK,
    summary="Get receipt details with items",
)
async def get_receipt(
    receipt_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ReceiptResponse:
    return await ReceiptService.get_receipt_detail(db=db, receipt_id=receipt_id)


@router.put(
    "/{receipt_id}",
    response_model=ReceiptResponse,
    status_code=status.HTTP_200_OK,
    summary="Update receipt details, lines, or draft status",
)
async def update_receipt(
    receipt_id: uuid.UUID,
    data: ReceiptUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_warehouse_staff),
) -> ReceiptResponse:
    return await ReceiptService.update_receipt(
        db=db, receipt_id=receipt_id, data=data, current_user=current_user
    )


@router.post(
    "/{receipt_id}/validate",
    response_model=ReceiptResponse,
    status_code=status.HTTP_200_OK,
    summary="Validate receipt and automatically increase inventory stock",
    description="Validates the receipt in an atomic transaction: increments location stock balances, writes immutable stock ledger records, and marks receipt DONE.",
)
async def validate_receipt(
    receipt_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_warehouse_staff),
) -> ReceiptResponse:
    return await ReceiptService.validate_receipt(
        db=db, receipt_id=receipt_id, current_user=current_user
    )


@router.post(
    "/{receipt_id}/cancel",
    response_model=ReceiptResponse,
    status_code=status.HTTP_200_OK,
    summary="Cancel receipt order",
)
async def cancel_receipt(
    receipt_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_warehouse_staff),
) -> ReceiptResponse:
    return await ReceiptService.cancel_receipt(
        db=db, receipt_id=receipt_id, current_user=current_user
    )
