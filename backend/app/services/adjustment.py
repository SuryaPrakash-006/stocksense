import math
import secrets
import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.adjustment import InventoryAdjustment
from app.models.enums import AdjustmentStatus, TransactionType
from app.models.product import Product
from app.models.stock import StockBalance, StockLedger
from app.models.user import User
from app.models.warehouse import Location
from app.repositories.adjustment import AdjustmentRepository
from app.schemas.adjustment import (
    InventoryAdjustmentCreate,
    InventoryAdjustmentPaginationResponse,
    InventoryAdjustmentResponse,
    InventoryAdjustmentUpdate,
)
from app.schemas.product import ProductCategoryResponse, ProductResponse
from app.schemas.warehouse import LocationResponse


def format_adjustment_response(
    adjustment: InventoryAdjustment,
) -> InventoryAdjustmentResponse:
    prod_resp = None
    if adjustment.product:
        cat_resp = (
            ProductCategoryResponse.model_validate(adjustment.product.category)
            if adjustment.product.category
            else None
        )
        prod_resp = ProductResponse(
            id=adjustment.product.id,
            name=adjustment.product.name,
            sku=adjustment.product.sku,
            category_id=adjustment.product.category_id,
            unit_of_measure=adjustment.product.unit_of_measure,
            reorder_level=adjustment.product.reorder_level,
            is_active=adjustment.product.is_active,
            created_at=adjustment.product.created_at,
            updated_at=adjustment.product.updated_at,
            category=cat_resp,
        )

    loc_resp = (
        LocationResponse.model_validate(adjustment.location)
        if adjustment.location
        else None
    )

    return InventoryAdjustmentResponse(
        id=adjustment.id,
        adjustment_number=adjustment.adjustment_number,
        product_id=adjustment.product_id,
        location_id=adjustment.location_id,
        previous_quantity=adjustment.previous_quantity,
        counted_quantity=adjustment.counted_quantity,
        difference=adjustment.difference,
        reason=adjustment.reason,
        status=adjustment.status,
        created_by=adjustment.created_by,
        validated_by=adjustment.validated_by,
        validated_at=adjustment.validated_at,
        created_at=adjustment.created_at,
        updated_at=adjustment.updated_at,
        product=prod_resp,
        location=loc_resp,
        created_by_name=adjustment.creator.name if adjustment.creator else None,
        validated_by_name=adjustment.validator.name if adjustment.validator else None,
    )


class AdjustmentService:
    @staticmethod
    async def get_recorded_stock(
        db: AsyncSession, product_id: uuid.UUID, location_id: uuid.UUID
    ) -> dict:
        stmt = select(StockBalance).where(
            StockBalance.product_id == product_id,
            StockBalance.location_id == location_id,
        )
        res = await db.execute(stmt)
        bal = res.scalars().first()
        recorded_qty = Decimal(str(bal.quantity)) if bal else Decimal("0.0000")
        return {
            "product_id": str(product_id),
            "location_id": str(location_id),
            "recorded_quantity": recorded_qty,
        }

    @staticmethod
    async def create_adjustment(
        db: AsyncSession, data: InventoryAdjustmentCreate, current_user: User
    ) -> InventoryAdjustmentResponse:
        repo = AdjustmentRepository(db)

        # Check product
        prod_res = await db.execute(
            select(Product).where(Product.id == data.product_id)
        )
        if not prod_res.scalars().first():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product with ID '{data.product_id}' not found.",
            )

        # Check location
        loc_res = await db.execute(
            select(Location).where(Location.id == data.location_id)
        )
        if not loc_res.scalars().first():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Location with ID '{data.location_id}' not found.",
            )

        # Fetch current system stock at location
        bal_res = await db.execute(
            select(StockBalance).where(
                StockBalance.product_id == data.product_id,
                StockBalance.location_id == data.location_id,
            )
        )
        current_balance = bal_res.scalars().first()
        prev_qty = Decimal(str(current_balance.quantity)) if current_balance else Decimal("0.0000")
        diff = data.counted_quantity - prev_qty

        adj_number = data.adjustment_number
        if not adj_number or not adj_number.strip():
            date_str = datetime.now(timezone.utc).strftime("%Y%m%d")
            suffix = secrets.token_hex(2).upper()
            adj_number = f"ADJ-{date_str}-{suffix}"
        else:
            existing = await repo.get_by_number(adj_number.strip().upper())
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Adjustment number '{adj_number}' already exists.",
                )

        adjustment = InventoryAdjustment(
            adjustment_number=adj_number.strip().upper(),
            product_id=data.product_id,
            location_id=data.location_id,
            previous_quantity=prev_qty,
            counted_quantity=data.counted_quantity,
            difference=diff,
            reason=data.reason,
            status=AdjustmentStatus.DRAFT,
            created_by=current_user.id,
        )
        db.add(adjustment)
        await db.commit()

        loaded = await repo.get_by_id_with_relations(adjustment.id)
        return format_adjustment_response(loaded)

    @staticmethod
    async def get_adjustment_detail(
        db: AsyncSession, adjustment_id: uuid.UUID
    ) -> InventoryAdjustmentResponse:
        repo = AdjustmentRepository(db)
        adj = await repo.get_by_id_with_relations(adjustment_id)
        if not adj:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Inventory adjustment order not found.",
            )
        return format_adjustment_response(adj)

    @staticmethod
    async def list_adjustments(
        db: AsyncSession,
        search: Optional[str] = None,
        status_filter: Optional[AdjustmentStatus] = None,
        product_id: Optional[uuid.UUID] = None,
        location_id: Optional[uuid.UUID] = None,
        warehouse_id: Optional[uuid.UUID] = None,
        page: int = 1,
        page_size: int = 20,
        sort_by: str = "created_at",
        sort_order: str = "desc",
    ) -> InventoryAdjustmentPaginationResponse:
        repo = AdjustmentRepository(db)
        items, total_count = await repo.list_adjustments(
            search=search,
            status=status_filter,
            product_id=product_id,
            location_id=location_id,
            warehouse_id=warehouse_id,
            page=page,
            page_size=page_size,
            sort_by=sort_by,
            sort_order=sort_order,
        )

        items_resp = [format_adjustment_response(a) for a in items]
        pages = math.ceil(total_count / page_size) if total_count > 0 else 1

        return InventoryAdjustmentPaginationResponse(
            items=items_resp,
            total=total_count,
            page=page,
            page_size=page_size,
            pages=pages,
        )

    @staticmethod
    async def apply_adjustment(
        db: AsyncSession, adjustment_id: uuid.UUID, current_user: User
    ) -> InventoryAdjustmentResponse:
        repo = AdjustmentRepository(db)
        adjustment = await repo.get_by_id_with_relations(adjustment_id)
        if not adjustment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Inventory adjustment not found.",
            )

        if adjustment.status == AdjustmentStatus.DONE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Adjustment has already been applied.",
            )
        if adjustment.status == AdjustmentStatus.CANCELED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot apply a canceled adjustment.",
            )

        # ATOMIC ADJUSTMENT EXECUTION
        bal_stmt = (
            select(StockBalance)
            .where(
                StockBalance.product_id == adjustment.product_id,
                StockBalance.location_id == adjustment.location_id,
            )
            .with_for_update()
        )
        bal_res = await db.execute(bal_stmt)
        stock_balance = bal_res.scalars().first()

        qty_before = Decimal(str(stock_balance.quantity)) if stock_balance else Decimal("0.0000")
        qty_after = Decimal(str(adjustment.counted_quantity))
        qty_change = qty_after - qty_before

        if not stock_balance:
            new_balance = StockBalance(
                product_id=adjustment.product_id,
                location_id=adjustment.location_id,
                quantity=qty_after,
            )
            db.add(new_balance)
        else:
            stock_balance.quantity = qty_after

        # Update adjustment record with final difference from exact locked before-quantity
        adjustment.previous_quantity = qty_before
        adjustment.difference = qty_change
        adjustment.status = AdjustmentStatus.DONE
        adjustment.validated_by = current_user.id
        adjustment.validated_at = datetime.now(timezone.utc)

        # Immutable Stock Ledger Entry
        ledger_entry = StockLedger(
            product_id=adjustment.product_id,
            location_id=adjustment.location_id,
            transaction_type=TransactionType.ADJUSTMENT,
            reference_type="inventory_adjustment",
            reference_id=adjustment.id,
            quantity_before=qty_before,
            quantity_change=qty_change,
            quantity_after=qty_after,
            created_by=current_user.id,
        )
        db.add(ledger_entry)

        await db.commit()
        loaded = await repo.get_by_id_with_relations(adjustment_id)
        return format_adjustment_response(loaded)

    @staticmethod
    async def cancel_adjustment(
        db: AsyncSession, adjustment_id: uuid.UUID, current_user: User
    ) -> InventoryAdjustmentResponse:
        repo = AdjustmentRepository(db)
        adjustment = await repo.get_by_id_with_relations(adjustment_id)
        if not adjustment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Inventory adjustment not found.",
            )

        if adjustment.status == AdjustmentStatus.DONE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot cancel an applied adjustment.",
            )
        if adjustment.status == AdjustmentStatus.CANCELED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Adjustment is already canceled.",
            )

        adjustment.status = AdjustmentStatus.CANCELED
        await db.commit()
        loaded = await repo.get_by_id_with_relations(adjustment_id)
        return format_adjustment_response(loaded)
