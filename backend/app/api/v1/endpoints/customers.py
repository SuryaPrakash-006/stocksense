import uuid
from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_current_user, require_inventory_manager
from app.db.session import get_db
from app.models.partner import Customer
from app.models.user import User
from app.repositories.partner import CustomerRepository
from app.schemas.partner import CustomerCreate, CustomerResponse

router = APIRouter()


@router.get(
    "",
    response_model=List[CustomerResponse],
    status_code=status.HTTP_200_OK,
    summary="List all active customers",
)
async def list_customers(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[CustomerResponse]:
    repo = CustomerRepository(db)
    customers = await repo.get_all_active()
    return [CustomerResponse.model_validate(c) for c in customers]


@router.post(
    "",
    response_model=CustomerResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new customer account",
)
async def create_customer(
    data: CustomerCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_inventory_manager),
) -> CustomerResponse:
    repo = CustomerRepository(db)
    customer = Customer(
        name=data.name.strip(),
        code=data.code.strip().upper() if data.code else None,
        contact_email=data.contact_email,
        phone=data.phone,
        address=data.address,
        is_active=True,
    )
    db.add(customer)
    await db.commit()
    await db.refresh(customer)
    return CustomerResponse.model_validate(customer)
