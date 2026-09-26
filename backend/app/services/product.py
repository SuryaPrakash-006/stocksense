import math
import uuid
from decimal import Decimal
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.enums import TransactionType
from app.models.product import Product, ProductCategory
from app.models.stock import StockBalance, StockLedger
from app.models.warehouse import Location
from app.models.user import User
from app.repositories.product import CategoryRepository, ProductRepository
from app.schemas.product import (
    ProductCategoryCreate,
    ProductCategoryResponse,
    ProductCategoryUpdate,
    ProductCreate,
    ProductDetailResponse,
    ProductListItemResponse,
    ProductPaginationResponse,
    ProductUpdate,
    StockStatus,
)


def compute_stock_status(total_stock: Decimal, reorder_level: Decimal) -> StockStatus:
    if total_stock <= Decimal("0.0000"):
        return StockStatus.OUT_OF_STOCK
    elif total_stock <= reorder_level:
        return StockStatus.LOW_STOCK
    return StockStatus.IN_STOCK


class CategoryService:
    @staticmethod
    async def list_categories(db: AsyncSession) -> List[ProductCategoryResponse]:
        repo = CategoryRepository(db)
        items = await repo.get_all_with_counts()
        return [
            ProductCategoryResponse(
                id=cat.id,
                name=cat.name,
                code=cat.code,
                description=cat.description,
                created_at=cat.created_at,
                updated_at=cat.updated_at,
                product_count=count,
            )
            for cat, count in items
        ]

    @staticmethod
    async def create_category(
        db: AsyncSession, data: ProductCategoryCreate
    ) -> ProductCategoryResponse:
        repo = CategoryRepository(db)
        existing = await repo.get_by_name(data.name)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Category '{data.name}' already exists.",
            )
        cat = await repo.create_category(
            name=data.name, code=data.code, description=data.description
        )
        return ProductCategoryResponse.model_validate(cat)

    @staticmethod
    async def update_category(
        db: AsyncSession, category_id: uuid.UUID, data: ProductCategoryUpdate
    ) -> ProductCategoryResponse:
        repo = CategoryRepository(db)
        cat = await repo.get_by_id(category_id)
        if not cat:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Category not found.",
            )
        if data.name and data.name.strip().lower() != cat.name.lower():
            existing = await repo.get_by_name(data.name)
            if existing and existing.id != category_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Category '{data.name}' already exists.",
                )
        updated = await repo.update_category(
            category=cat,
            name=data.name,
            code=data.code,
            description=data.description,
        )
        return ProductCategoryResponse.model_validate(updated)

    @staticmethod
    async def delete_category(db: AsyncSession, category_id: uuid.UUID) -> dict:
        repo = CategoryRepository(db)
        cat = await repo.get_by_id(category_id)
        if not cat:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Category not found.",
            )
        # Check if products are assigned
        result = await db.execute(
            select(Product).where(Product.category_id == category_id, Product.is_active == True)
        )
        if result.scalars().first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete category because it currently has active products assigned.",
            )
        await repo.delete(cat)
        return {"message": "Category successfully deleted."}


class ProductService:
    @staticmethod
    async def create_product(
        db: AsyncSession, data: ProductCreate, current_user: User
    ) -> ProductDetailResponse:
        repo = ProductRepository(db)

        # 1. SKU uniqueness check
        existing_sku = await repo.get_by_sku(data.sku)
        if existing_sku:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"A product with SKU '{data.sku}' already exists.",
            )

        # 2. Category check if specified by ID or Name
        final_category_id = data.category_id
        if data.category_name and data.category_name.strip():
            cat_name = data.category_name.strip()
            cat_repo = CategoryRepository(db)
            cat = await cat_repo.get_by_name(cat_name)
            if not cat:
                cat = ProductCategory(name=cat_name, code=None, description=None)
                db.add(cat)
                await db.flush()
            final_category_id = cat.id
        elif data.category_id:
            cat_repo = CategoryRepository(db)
            cat = await cat_repo.get_by_id(data.category_id)
            if not cat:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Specified category does not exist.",
                )
            final_category_id = data.category_id

        # 3. Create product record
        product = Product(
            name=data.name.strip(),
            sku=data.sku.strip().upper(),
            category_id=final_category_id,
            unit_of_measure=data.unit_of_measure.strip(),
            reorder_level=data.reorder_level,
            is_active=data.is_active,
        )
        db.add(product)
        await db.flush()

        # 4. Handle optional initial stock atomically
        initial_qty = data.initial_stock or Decimal("0.0000")
        if initial_qty > Decimal("0.0000"):
            if not data.initial_location_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Initial stock quantity specified but no target location provided.",
                )

            # Check location exists
            loc_result = await db.execute(
                select(Location).where(Location.id == data.initial_location_id)
            )
            location = loc_result.scalars().first()
            if not location:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Target warehouse location not found.",
                )

            # Insert stock balance
            stock_balance = StockBalance(
                product_id=product.id,
                location_id=location.id,
                quantity=initial_qty,
            )
            db.add(stock_balance)

            # Insert immutable stock ledger entry
            ledger_entry = StockLedger(
                product_id=product.id,
                location_id=location.id,
                transaction_type=TransactionType.RECEIPT,
                reference_type="initial_inventory",
                reference_id=product.id,
                quantity_before=Decimal("0.0000"),
                quantity_change=initial_qty,
                quantity_after=initial_qty,
                created_by=current_user.id,
            )
            db.add(ledger_entry)

        await db.commit()
        await db.refresh(product)

        return await ProductService.get_product_detail(db, product.id)

    @staticmethod
    async def list_products(
        db: AsyncSession,
        search: Optional[str] = None,
        category_id: Optional[uuid.UUID] = None,
        warehouse_id: Optional[uuid.UUID] = None,
        location_id: Optional[uuid.UUID] = None,
        stock_status: StockStatus = StockStatus.ALL,
        page: int = 1,
        page_size: int = 20,
        sort_by: str = "created_at",
        sort_order: str = "desc",
    ) -> ProductPaginationResponse:
        repo = ProductRepository(db)
        items_with_stock, total_count = await repo.list_products(
            search=search,
            category_id=category_id,
            warehouse_id=warehouse_id,
            location_id=location_id,
            stock_status=stock_status,
            page=page,
            page_size=page_size,
            sort_by=sort_by,
            sort_order=sort_order,
        )

        response_items = []
        for prod, stock in items_with_stock:
            cat_response = (
                ProductCategoryResponse.model_validate(prod.category)
                if prod.category
                else None
            )
            response_items.append(
                ProductListItemResponse(
                    id=prod.id,
                    name=prod.name,
                    sku=prod.sku,
                    category_id=prod.category_id,
                    unit_of_measure=prod.unit_of_measure,
                    reorder_level=prod.reorder_level,
                    is_active=prod.is_active,
                    created_at=prod.created_at,
                    updated_at=prod.updated_at,
                    category=cat_response,
                    total_stock=stock,
                    stock_status=compute_stock_status(stock, prod.reorder_level),
                )
            )

        pages = math.ceil(total_count / page_size) if total_count > 0 else 1

        return ProductPaginationResponse(
            items=response_items,
            total=total_count,
            page=page,
            page_size=page_size,
            pages=pages,
        )

    @staticmethod
    async def get_product_detail(
        db: AsyncSession, product_id: uuid.UUID
    ) -> ProductDetailResponse:
        repo = ProductRepository(db)
        product = await repo.get_with_relations(product_id)
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found.",
            )

        location_stocks = await repo.get_location_stocks(product_id)
        movements = await repo.get_recent_movements(product_id)

        total_stock = sum(
            (loc.quantity for loc in location_stocks), Decimal("0.0000")
        )
        cat_response = (
            ProductCategoryResponse.model_validate(product.category)
            if product.category
            else None
        )

        return ProductDetailResponse(
            id=product.id,
            name=product.name,
            sku=product.sku,
            category_id=product.category_id,
            unit_of_measure=product.unit_of_measure,
            reorder_level=product.reorder_level,
            is_active=product.is_active,
            created_at=product.created_at,
            updated_at=product.updated_at,
            category=cat_response,
            total_stock=total_stock,
            stock_status=compute_stock_status(total_stock, product.reorder_level),
            location_stocks=location_stocks,
            movements=movements,
        )

    @staticmethod
    async def update_product(
        db: AsyncSession,
        product_id: uuid.UUID,
        data: ProductUpdate,
        current_user: User,
    ) -> ProductDetailResponse:
        repo = ProductRepository(db)
        product = await repo.get_by_id(product_id)
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found.",
            )

        # SKU uniqueness check if changed
        if data.sku and data.sku.strip().lower() != product.sku.lower():
            existing_sku = await repo.get_by_sku(data.sku)
            if existing_sku and existing_sku.id != product_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"SKU '{data.sku}' is already used by another product.",
                )
            product.sku = data.sku.strip().upper()

        if data.name is not None:
            product.name = data.name.strip()
        if data.category_name is not None:
            if data.category_name.strip():
                cat_name = data.category_name.strip()
                cat_repo = CategoryRepository(db)
                cat = await cat_repo.get_by_name(cat_name)
                if not cat:
                    cat = ProductCategory(name=cat_name, code=None, description=None)
                    db.add(cat)
                    await db.flush()
                product.category_id = cat.id
            else:
                product.category_id = None
        elif data.category_id is not None:
            cat_repo = CategoryRepository(db)
            cat = await cat_repo.get_by_id(data.category_id)
            if not cat:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Specified category does not exist.",
                )
            product.category_id = data.category_id
        if data.unit_of_measure is not None:
            product.unit_of_measure = data.unit_of_measure.strip()
        if data.reorder_level is not None:
            product.reorder_level = data.reorder_level
        if data.is_active is not None:
            product.is_active = data.is_active

        await db.commit()
        return await ProductService.get_product_detail(db, product_id)

    @staticmethod
    async def delete_product(
        db: AsyncSession, product_id: uuid.UUID, current_user: User
    ) -> dict:
        repo = ProductRepository(db)
        product = await repo.get_by_id(product_id)
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found.",
            )

        # Check if product has non-zero stock
        location_stocks = await repo.get_location_stocks(product_id)
        total_stock = sum((loc.quantity for loc in location_stocks), Decimal("0.0000"))
        if total_stock > Decimal("0.0000"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot delete product with active on-hand inventory ({total_stock} units). Perform a stock adjustment first.",
            )

        # Soft-delete by setting inactive
        product.is_active = False
        await db.commit()
        return {"message": "Product successfully deactivated."}
