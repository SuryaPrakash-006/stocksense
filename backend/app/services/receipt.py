import math
import secrets
import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.enums import DocumentStatus, TransactionType
from app.models.partner import Supplier
from app.models.product import Product
from app.models.receipt import Receipt, ReceiptItem
from app.models.stock import StockBalance, StockLedger
from app.models.warehouse import Location
from app.models.user import User
from app.repositories.receipt import ReceiptRepository
from app.schemas.partner import SupplierResponse
from app.schemas.product import ProductCategoryResponse, ProductResponse
from app.schemas.receipt import (
    ReceiptCreate,
    ReceiptItemResponse,
    ReceiptPaginationResponse,
    ReceiptResponse,
    ReceiptUpdate,
)
from app.schemas.warehouse import LocationResponse


def format_receipt_response(receipt: Receipt) -> ReceiptResponse:
    items_response = []
    total_qty = Decimal("0.0000")

    for item in receipt.items:
        prod_resp = None
        if item.product:
            cat_resp = (
                ProductCategoryResponse.model_validate(item.product.category)
                if item.product.category
                else None
            )
            prod_resp = ProductResponse(
                id=item.product.id,
                name=item.product.name,
                sku=item.product.sku,
                category_id=item.product.category_id,
                unit_of_measure=item.product.unit_of_measure,
                reorder_level=item.product.reorder_level,
                is_active=item.product.is_active,
                created_at=item.product.created_at,
                updated_at=item.product.updated_at,
                category=cat_resp,
            )
        total_qty += Decimal(str(item.quantity))
        items_response.append(
            ReceiptItemResponse(
                id=item.id,
                receipt_id=item.receipt_id,
                product_id=item.product_id,
                quantity=item.quantity,
                created_at=item.created_at,
                updated_at=item.updated_at,
                product=prod_resp,
            )
        )

    supplier_resp = (
        SupplierResponse.model_validate(receipt.supplier)
        if receipt.supplier
        else None
    )
    location_resp = (
        LocationResponse.model_validate(receipt.destination_location)
        if receipt.destination_location
        else None
    )

    return ReceiptResponse(
        id=receipt.id,
        receipt_number=receipt.receipt_number,
        supplier_id=receipt.supplier_id,
        destination_location_id=receipt.destination_location_id,
        status=receipt.status,
        notes=receipt.notes,
        created_by=receipt.created_by,
        validated_by=receipt.validated_by,
        validated_at=receipt.validated_at,
        created_at=receipt.created_at,
        updated_at=receipt.updated_at,
        supplier=supplier_resp,
        destination_location=location_resp,
        items=items_response,
        total_items=len(receipt.items),
        total_quantity=total_qty,
        created_by_name=receipt.creator.name if receipt.creator else None,
        validated_by_name=receipt.validator.name if receipt.validator else None,
    )


class ReceiptService:
    @staticmethod
    async def create_receipt(
        db: AsyncSession, data: ReceiptCreate, current_user: User
    ) -> ReceiptResponse:
        repo = ReceiptRepository(db)

        # 1. Check Supplier
        sup_result = await db.execute(
            select(Supplier).where(Supplier.id == data.supplier_id)
        )
        if not sup_result.scalars().first():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Selected supplier does not exist.",
            )

        # 2. Check Destination Location
        loc_result = await db.execute(
            select(Location).where(Location.id == data.destination_location_id)
        )
        if not loc_result.scalars().first():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Selected warehouse location does not exist.",
            )

        # 3. Generate receipt number if not provided
        receipt_number = data.receipt_number
        if not receipt_number or not receipt_number.strip():
            date_str = datetime.now(timezone.utc).strftime("%Y%m%d")
            random_suffix = secrets.token_hex(2).upper()
            receipt_number = f"REC-{date_str}-{random_suffix}"
        else:
            existing_num = await repo.get_by_number(receipt_number)
            if existing_num:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Receipt number '{receipt_number}' already exists.",
                )

        # 4. Create Header
        receipt = Receipt(
            receipt_number=receipt_number.strip().upper(),
            supplier_id=data.supplier_id,
            destination_location_id=data.destination_location_id,
            status=DocumentStatus.DRAFT,
            notes=data.notes,
            created_by=current_user.id,
        )
        db.add(receipt)
        await db.flush()

        # 5. Create Items
        for item_in in data.items:
            # Check product exists
            prod_res = await db.execute(
                select(Product).where(Product.id == item_in.product_id)
            )
            if not prod_res.scalars().first():
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Product with ID '{item_in.product_id}' not found.",
                )
            if item_in.quantity <= Decimal("0.0000"):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Item quantity must be strictly greater than zero.",
                )

            item = ReceiptItem(
                receipt_id=receipt.id,
                product_id=item_in.product_id,
                quantity=item_in.quantity,
            )
            db.add(item)

        await db.commit()
        return await ReceiptService.get_receipt_detail(db, receipt.id)

    @staticmethod
    async def get_receipt_detail(
        db: AsyncSession, receipt_id: uuid.UUID
    ) -> ReceiptResponse:
        repo = ReceiptRepository(db)
        receipt = await repo.get_by_id_with_relations(receipt_id)
        if not receipt:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Receipt not found.",
            )
        return format_receipt_response(receipt)

    @staticmethod
    async def list_receipts(
        db: AsyncSession,
        search: Optional[str] = None,
        status_filter: Optional[DocumentStatus] = None,
        supplier_id: Optional[uuid.UUID] = None,
        destination_location_id: Optional[uuid.UUID] = None,
        warehouse_id: Optional[uuid.UUID] = None,
        page: int = 1,
        page_size: int = 20,
        sort_by: str = "created_at",
        sort_order: str = "desc",
    ) -> ReceiptPaginationResponse:
        repo = ReceiptRepository(db)
        receipts, total_count = await repo.list_receipts(
            search=search,
            status=status_filter,
            supplier_id=supplier_id,
            destination_location_id=destination_location_id,
            warehouse_id=warehouse_id,
            page=page,
            page_size=page_size,
            sort_by=sort_by,
            sort_order=sort_order,
        )

        items_resp = [format_receipt_response(r) for r in receipts]
        pages = math.ceil(total_count / page_size) if total_count > 0 else 1

        return ReceiptPaginationResponse(
            items=items_resp,
            total=total_count,
            page=page,
            page_size=page_size,
            pages=pages,
        )

    @staticmethod
    async def update_receipt(
        db: AsyncSession,
        receipt_id: uuid.UUID,
        data: ReceiptUpdate,
        current_user: User,
    ) -> ReceiptResponse:
        repo = ReceiptRepository(db)
        receipt = await repo.get_by_id_with_relations(receipt_id)
        if not receipt:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Receipt not found.",
            )

        if receipt.status == DocumentStatus.DONE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot modify a validated receipt.",
            )
        if receipt.status == DocumentStatus.CANCELED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot modify a canceled receipt.",
            )

        # Update Header fields
        if data.supplier_id is not None:
            receipt.supplier_id = data.supplier_id
        if data.destination_location_id is not None:
            receipt.destination_location_id = data.destination_location_id
        if data.notes is not None:
            receipt.notes = data.notes
        if data.status is not None:
            if data.status not in [DocumentStatus.DRAFT, DocumentStatus.WAITING, DocumentStatus.READY]:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Use /validate or /cancel endpoints to finalize receipt status.",
                )
            receipt.status = data.status

        # Replace Items if provided
        if data.items is not None:
            if len(data.items) == 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Receipt must contain at least one item.",
                )
            await db.execute(
                delete(ReceiptItem).where(ReceiptItem.receipt_id == receipt_id)
            )
            for item_in in data.items:
                if item_in.quantity <= Decimal("0.0000"):
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Quantity must be strictly positive.",
                    )
                new_item = ReceiptItem(
                    receipt_id=receipt_id,
                    product_id=item_in.product_id,
                    quantity=item_in.quantity,
                )
                db.add(new_item)

        await db.commit()
        return await ReceiptService.get_receipt_detail(db, receipt_id)

    @staticmethod
    async def validate_receipt(
        db: AsyncSession, receipt_id: uuid.UUID, current_user: User
    ) -> ReceiptResponse:
        repo = ReceiptRepository(db)
        receipt = await repo.get_by_id_with_relations(receipt_id)
        if not receipt:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Receipt not found.",
            )

        if receipt.status == DocumentStatus.DONE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Receipt has already been validated and stock was received.",
            )
        if receipt.status == DocumentStatus.CANCELED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot validate a canceled receipt.",
            )
        if len(receipt.items) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot validate receipt with no items.",
            )

        # ATOMIC VALIDATION TRANSACTION
        for item in receipt.items:
            # Row-level locking to prevent concurrent balance anomalies
            balance_stmt = (
                select(StockBalance)
                .where(
                    StockBalance.product_id == item.product_id,
                    StockBalance.location_id == receipt.destination_location_id,
                )
                .with_for_update()
            )
            bal_res = await db.execute(balance_stmt)
            balance = bal_res.scalars().first()

            if not balance:
                qty_before = Decimal("0.0000")
                qty_change = Decimal(str(item.quantity))
                qty_after = qty_change

                new_balance = StockBalance(
                    product_id=item.product_id,
                    location_id=receipt.destination_location_id,
                    quantity=qty_after,
                )
                db.add(new_balance)
            else:
                qty_before = Decimal(str(balance.quantity))
                qty_change = Decimal(str(item.quantity))
                qty_after = qty_before + qty_change
                balance.quantity = qty_after

            # Create Stock Ledger Entry
            ledger = StockLedger(
                product_id=item.product_id,
                location_id=receipt.destination_location_id,
                transaction_type=TransactionType.RECEIPT,
                reference_type="receipt",
                reference_id=receipt.id,
                quantity_before=qty_before,
                quantity_change=qty_change,
                quantity_after=qty_after,
                created_by=current_user.id,
            )
            db.add(ledger)

        receipt.status = DocumentStatus.DONE
        receipt.validated_by = current_user.id
        receipt.validated_at = datetime.now(timezone.utc)

        await db.commit()
        return await ReceiptService.get_receipt_detail(db, receipt.id)

    @staticmethod
    async def cancel_receipt(
        db: AsyncSession, receipt_id: uuid.UUID, current_user: User
    ) -> ReceiptResponse:
        repo = ReceiptRepository(db)
        receipt = await repo.get_by_id_with_relations(receipt_id)
        if not receipt:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Receipt not found.",
            )

        if receipt.status == DocumentStatus.DONE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot cancel a receipt that has already been validated. Use Inventory Adjustment instead.",
            )
        if receipt.status == DocumentStatus.CANCELED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Receipt is already canceled.",
            )

        receipt.status = DocumentStatus.CANCELED
        await db.commit()
        return await ReceiptService.get_receipt_detail(db, receipt.id)
