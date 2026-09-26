import math
import secrets
import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import Dict, List, Optional
from fastapi import HTTPException, status
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.delivery import DeliveryItem, DeliveryOrder
from app.models.enums import DocumentStatus, TransactionType
from app.models.partner import Customer
from app.models.product import Product
from app.models.stock import StockBalance, StockLedger
from app.models.warehouse import Location
from app.models.user import User
from app.repositories.delivery import DeliveryRepository
from app.schemas.delivery import (
    DeliveryItemResponse,
    DeliveryOrderCreate,
    DeliveryOrderResponse,
    DeliveryOrderUpdate,
    DeliveryPaginationResponse,
)
from app.schemas.partner import CustomerResponse
from app.schemas.product import ProductCategoryResponse, ProductResponse
from app.schemas.warehouse import LocationResponse


async def format_delivery_response(
    db: AsyncSession, delivery: DeliveryOrder
) -> DeliveryOrderResponse:
    # Fetch live stock balances for all items at source_location
    product_ids = [it.product_id for it in delivery.items]
    stock_map: Dict[uuid.UUID, Decimal] = {}

    if product_ids:
        bal_stmt = select(StockBalance).where(
            StockBalance.location_id == delivery.source_location_id,
            StockBalance.product_id.in_(product_ids),
        )
        bal_res = await db.execute(bal_stmt)
        for bal in bal_res.scalars().all():
            stock_map[bal.product_id] = Decimal(str(bal.quantity))

    items_response = []
    total_qty = Decimal("0.0000")
    all_sufficient = True

    for item in delivery.items:
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

        avail_stock = stock_map.get(item.product_id, Decimal("0.0000"))
        req_qty = Decimal(str(item.quantity))
        is_suff = (delivery.status == DocumentStatus.DONE) or (avail_stock >= req_qty)
        if not is_suff:
            all_sufficient = False

        total_qty += req_qty
        items_response.append(
            DeliveryItemResponse(
                id=item.id,
                delivery_id=item.delivery_id,
                product_id=item.product_id,
                quantity=item.quantity,
                created_at=item.created_at,
                updated_at=item.updated_at,
                product=prod_resp,
                available_stock=avail_stock,
                is_sufficient=is_suff,
            )
        )

    customer_resp = (
        CustomerResponse.model_validate(delivery.customer)
        if delivery.customer
        else None
    )
    location_resp = (
        LocationResponse.model_validate(delivery.source_location)
        if delivery.source_location
        else None
    )

    return DeliveryOrderResponse(
        id=delivery.id,
        delivery_number=delivery.delivery_number,
        customer_id=delivery.customer_id,
        source_location_id=delivery.source_location_id,
        status=delivery.status,
        notes=delivery.notes,
        created_by=delivery.created_by,
        validated_by=delivery.validated_by,
        validated_at=delivery.validated_at,
        created_at=delivery.created_at,
        updated_at=delivery.updated_at,
        customer=customer_resp,
        source_location=location_resp,
        items=items_response,
        total_items=len(delivery.items),
        total_quantity=total_qty,
        created_by_name=delivery.creator.name if delivery.creator else None,
        validated_by_name=delivery.validator.name if delivery.validator else None,
        has_sufficient_stock=all_sufficient,
    )


class DeliveryService:
    @staticmethod
    async def create_delivery(
        db: AsyncSession, data: DeliveryOrderCreate, current_user: User
    ) -> DeliveryOrderResponse:
        repo = DeliveryRepository(db)

        # 1. Customer Check
        cust_res = await db.execute(
            select(Customer).where(Customer.id == data.customer_id)
        )
        if not cust_res.scalars().first():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Selected customer does not exist.",
            )

        # 2. Source Location Check
        loc_res = await db.execute(
            select(Location).where(Location.id == data.source_location_id)
        )
        if not loc_res.scalars().first():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Selected source warehouse location does not exist.",
            )

        # 3. Delivery Number
        delivery_number = data.delivery_number
        if not delivery_number or not delivery_number.strip():
            date_str = datetime.now(timezone.utc).strftime("%Y%m%d")
            random_suffix = secrets.token_hex(2).upper()
            delivery_number = f"DEL-{date_str}-{random_suffix}"
        else:
            existing_num = await repo.get_by_number(delivery_number)
            if existing_num:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Delivery order number '{delivery_number}' already exists.",
                )

        # 4. Header
        delivery = DeliveryOrder(
            delivery_number=delivery_number.strip().upper(),
            customer_id=data.customer_id,
            source_location_id=data.source_location_id,
            status=DocumentStatus.DRAFT,
            notes=data.notes,
            created_by=current_user.id,
        )
        db.add(delivery)
        await db.flush()

        # 5. Items
        for item_in in data.items:
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

            item = DeliveryItem(
                delivery_id=delivery.id,
                product_id=item_in.product_id,
                quantity=item_in.quantity,
            )
            db.add(item)

        await db.commit()
        return await DeliveryService.get_delivery_detail(db, delivery.id)

    @staticmethod
    async def get_delivery_detail(
        db: AsyncSession, delivery_id: uuid.UUID
    ) -> DeliveryOrderResponse:
        repo = DeliveryRepository(db)
        delivery = await repo.get_by_id_with_relations(delivery_id)
        if not delivery:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Delivery order not found.",
            )
        return await format_delivery_response(db, delivery)

    @staticmethod
    async def list_deliveries(
        db: AsyncSession,
        search: Optional[str] = None,
        status_filter: Optional[DocumentStatus] = None,
        customer_id: Optional[uuid.UUID] = None,
        source_location_id: Optional[uuid.UUID] = None,
        warehouse_id: Optional[uuid.UUID] = None,
        page: int = 1,
        page_size: int = 20,
        sort_by: str = "created_at",
        sort_order: str = "desc",
    ) -> DeliveryPaginationResponse:
        repo = DeliveryRepository(db)
        deliveries, total_count = await repo.list_deliveries(
            search=search,
            status=status_filter,
            customer_id=customer_id,
            source_location_id=source_location_id,
            warehouse_id=warehouse_id,
            page=page,
            page_size=page_size,
            sort_by=sort_by,
            sort_order=sort_order,
        )

        items_resp = [await format_delivery_response(db, d) for d in deliveries]
        pages = math.ceil(total_count / page_size) if total_count > 0 else 1

        return DeliveryPaginationResponse(
            items=items_resp,
            total=total_count,
            page=page,
            page_size=page_size,
            pages=pages,
        )

    @staticmethod
    async def update_delivery(
        db: AsyncSession,
        delivery_id: uuid.UUID,
        data: DeliveryOrderUpdate,
        current_user: User,
    ) -> DeliveryOrderResponse:
        repo = DeliveryRepository(db)
        delivery = await repo.get_by_id_with_relations(delivery_id)
        if not delivery:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Delivery order not found.",
            )

        if delivery.status == DocumentStatus.DONE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot modify a validated delivery order.",
            )
        if delivery.status == DocumentStatus.CANCELED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot modify a canceled delivery order.",
            )

        if data.customer_id is not None:
            delivery.customer_id = data.customer_id
        if data.source_location_id is not None:
            delivery.source_location_id = data.source_location_id
        if data.notes is not None:
            delivery.notes = data.notes
        if data.status is not None:
            if data.status not in [DocumentStatus.DRAFT, DocumentStatus.WAITING, DocumentStatus.READY]:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Use /validate or /cancel endpoints to finalize delivery status.",
                )
            delivery.status = data.status

        if data.items is not None:
            if len(data.items) == 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Delivery order must contain at least one item.",
                )
            await db.execute(
                delete(DeliveryItem).where(DeliveryItem.delivery_id == delivery_id)
            )
            for item_in in data.items:
                if item_in.quantity <= Decimal("0.0000"):
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Quantity must be strictly positive.",
                    )
                new_item = DeliveryItem(
                    delivery_id=delivery_id,
                    product_id=item_in.product_id,
                    quantity=item_in.quantity,
                )
                db.add(new_item)

        await db.commit()
        return await DeliveryService.get_delivery_detail(db, delivery_id)

    @staticmethod
    async def validate_delivery(
        db: AsyncSession, delivery_id: uuid.UUID, current_user: User
    ) -> DeliveryOrderResponse:
        repo = DeliveryRepository(db)
        delivery = await repo.get_by_id_with_relations(delivery_id)
        if not delivery:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Delivery order not found.",
            )

        if delivery.status == DocumentStatus.DONE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Delivery order has already been validated and shipped.",
            )
        if delivery.status == DocumentStatus.CANCELED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot validate a canceled delivery order.",
            )
        if len(delivery.items) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot validate delivery with no line items.",
            )

        # ATOMIC OUTGOING STOCK DEDUCTION
        for item in delivery.items:
            balance_stmt = (
                select(StockBalance)
                .where(
                    StockBalance.product_id == item.product_id,
                    StockBalance.location_id == delivery.source_location_id,
                )
                .with_for_update()
            )
            bal_res = await db.execute(balance_stmt)
            balance = bal_res.scalars().first()

            available = Decimal(str(balance.quantity)) if balance else Decimal("0.0000")
            required = Decimal(str(item.quantity))

            if available < required:
                sku_str = item.product.sku if item.product else str(item.product_id)
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Insufficient stock for product '{sku_str}'. Required: {required}, Available: {available} at source location.",
                )

            qty_before = available
            qty_change = -required
            qty_after = qty_before - required
            balance.quantity = qty_after

            # Insert immutable DELIVERY ledger record
            ledger = StockLedger(
                product_id=item.product_id,
                location_id=delivery.source_location_id,
                transaction_type=TransactionType.DELIVERY,
                reference_type="delivery_order",
                reference_id=delivery.id,
                quantity_before=qty_before,
                quantity_change=qty_change,
                quantity_after=qty_after,
                created_by=current_user.id,
            )
            db.add(ledger)

        delivery.status = DocumentStatus.DONE
        delivery.validated_by = current_user.id
        delivery.validated_at = datetime.now(timezone.utc)

        await db.commit()
        return await DeliveryService.get_delivery_detail(db, delivery.id)

    @staticmethod
    async def cancel_delivery(
        db: AsyncSession, delivery_id: uuid.UUID, current_user: User
    ) -> DeliveryOrderResponse:
        repo = DeliveryRepository(db)
        delivery = await repo.get_by_id_with_relations(delivery_id)
        if not delivery:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Delivery order not found.",
            )

        if delivery.status == DocumentStatus.DONE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot cancel an order that has already been validated and shipped.",
            )
        if delivery.status == DocumentStatus.CANCELED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Delivery order is already canceled.",
            )

        delivery.status = DocumentStatus.CANCELED
        await db.commit()
        return await DeliveryService.get_delivery_detail(db, delivery.id)
