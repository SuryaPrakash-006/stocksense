import uuid
from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_current_user, require_warehouse_staff
from app.db.session import get_db
from app.models.enums import DocumentStatus
from app.models.user import User
from app.schemas.transfer import (
    InternalTransferCreate,
    InternalTransferPaginationResponse,
    InternalTransferResponse,
    InternalTransferUpdate,
)
from app.services.transfer import TransferService

router = APIRouter()


@router.get(
    "",
    response_model=InternalTransferPaginationResponse,
    status_code=status.HTTP_200_OK,
    summary="List internal transfers with filters and pagination",
)
async def list_transfers(
    search: Optional[str] = Query(None, description="Search by transfer number"),
    status: Optional[DocumentStatus] = Query(None, description="Filter by status: DRAFT, READY, DONE, CANCELED"),
    source_location_id: Optional[uuid.UUID] = Query(None, description="Filter by source location ID"),
    destination_location_id: Optional[uuid.UUID] = Query(None, description="Filter by destination location ID"),
    warehouse_id: Optional[uuid.UUID] = Query(None, description="Filter by warehouse ID"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    sort_by: str = Query("created_at", description="Field to sort by: created_at, transfer_number, status"),
    sort_order: str = Query("desc", description="Sort order: asc or desc"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> InternalTransferPaginationResponse:
    return await TransferService.list_transfers(
        db=db,
        search=search,
        status_filter=status,
        source_location_id=source_location_id,
        destination_location_id=destination_location_id,
        warehouse_id=warehouse_id,
        page=page,
        page_size=page_size,
        sort_by=sort_by,
        sort_order=sort_order,
    )


@router.post(
    "",
    response_model=InternalTransferResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new internal transfer request",
)
async def create_transfer(
    data: InternalTransferCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_warehouse_staff),
) -> InternalTransferResponse:
    return await TransferService.create_transfer(
        db=db, data=data, current_user=current_user
    )


@router.get(
    "/{transfer_id}",
    response_model=InternalTransferResponse,
    status_code=status.HTTP_200_OK,
    summary="Get internal transfer details with real-time stock balances",
)
async def get_transfer(
    transfer_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> InternalTransferResponse:
    return await TransferService.get_transfer_detail(db=db, transfer_id=transfer_id)


@router.put(
    "/{transfer_id}",
    response_model=InternalTransferResponse,
    status_code=status.HTTP_200_OK,
    summary="Update internal transfer order details, items, or status",
)
async def update_transfer(
    transfer_id: uuid.UUID,
    data: InternalTransferUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_warehouse_staff),
) -> InternalTransferResponse:
    return await TransferService.update_transfer(
        db=db, transfer_id=transfer_id, data=data, current_user=current_user
    )


@router.post(
    "/{transfer_id}/validate",
    response_model=InternalTransferResponse,
    status_code=status.HTTP_200_OK,
    summary="Complete transfer, atomically reallocating stock and creating TRANSFER_OUT/TRANSFER_IN ledger records",
)
async def validate_transfer(
    transfer_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_warehouse_staff),
) -> InternalTransferResponse:
    return await TransferService.validate_transfer(
        db=db, transfer_id=transfer_id, current_user=current_user
    )


@router.post(
    "/{transfer_id}/cancel",
    response_model=InternalTransferResponse,
    status_code=status.HTTP_200_OK,
    summary="Cancel internal transfer order",
)
async def cancel_transfer(
    transfer_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_warehouse_staff),
) -> InternalTransferResponse:
    return await TransferService.cancel_transfer(
        db=db, transfer_id=transfer_id, current_user=current_user
    )
