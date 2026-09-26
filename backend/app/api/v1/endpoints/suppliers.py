import uuid
from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_current_user, require_inventory_manager
from app.db.session import get_db
from app.models.partner import Supplier
from app.models.user import User
from app.repositories.partner import SupplierRepository
from app.schemas.partner import SupplierCreate, SupplierResponse

router = APIRouter()


@router.get(
    "",
    response_model=List[SupplierResponse],
    status_code=status.HTTP_200_OK,
    summary="List all active suppliers",
)
async def list_suppliers(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[SupplierResponse]:
    repo = SupplierRepository(db)
    suppliers = await repo.get_all_active()
    return [SupplierResponse.model_validate(s) for s in suppliers]


@router.post(
    "",
    response_model=SupplierResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new supplier",
)
async def create_supplier(
    data: SupplierCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_inventory_manager),
) -> SupplierResponse:
    repo = SupplierRepository(db)
    supplier = Supplier(
        name=data.name.strip(),
        code=data.code.strip().upper() if data.code else None,
        contact_email=data.contact_email,
        phone=data.phone,
        address=data.address,
        is_active=True,
    )
    db.add(supplier)
    await db.commit()
    await db.refresh(supplier)
    return SupplierResponse.model_validate(supplier)
