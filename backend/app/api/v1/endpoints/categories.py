import uuid
from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_current_user, require_inventory_manager
from app.db.session import get_db
from app.models.user import User
from app.schemas.product import (
    ProductCategoryCreate,
    ProductCategoryResponse,
    ProductCategoryUpdate,
)
from app.services.product import CategoryService

router = APIRouter()


@router.get(
    "",
    response_model=List[ProductCategoryResponse],
    status_code=status.HTTP_200_OK,
    summary="List all product categories",
    description="Retrieves all product categories with their current active product counts.",
)
async def list_categories(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[ProductCategoryResponse]:
    return await CategoryService.list_categories(db=db)


@router.post(
    "",
    response_model=ProductCategoryResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create product category",
    description="Creates a new category. Restricted to Inventory Managers.",
)
async def create_category(
    data: ProductCategoryCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_inventory_manager),
) -> ProductCategoryResponse:
    return await CategoryService.create_category(db=db, data=data)


@router.put(
    "/{category_id}",
    response_model=ProductCategoryResponse,
    status_code=status.HTTP_200_OK,
    summary="Update product category",
    description="Modifies an existing product category. Restricted to Inventory Managers.",
)
async def update_category(
    category_id: uuid.UUID,
    data: ProductCategoryUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_inventory_manager),
) -> ProductCategoryResponse:
    return await CategoryService.update_category(
        db=db, category_id=category_id, data=data
    )


@router.delete(
    "/{category_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete product category",
    description="Deletes a category if no active products are assigned. Restricted to Inventory Managers.",
)
async def delete_category(
    category_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_inventory_manager),
) -> dict:
    return await CategoryService.delete_category(db=db, category_id=category_id)
