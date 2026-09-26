"""Initial StockSense schema: Core entities, Stock Balances, and Stock Ledger

Revision ID: 0001_initial_schema
Revises: 
Create Date: 2026-09-26 12:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "0001_initial_schema"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. users
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("role", sa.String(length=50), nullable=False, server_default="WAREHOUSE_STAFF"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_users_id", "users", ["id"])
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    # 1b. password_reset_otps
    op.create_table(
        "password_reset_otps",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("otp_code", sa.String(length=6), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("is_used", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("attempts", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_password_reset_otps_id", "password_reset_otps", ["id"])
    op.create_index("ix_password_reset_otps_email", "password_reset_otps", ["email"])

    # 2. warehouses
    op.create_table(
        "warehouses",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("code", sa.String(length=50), nullable=False),
        sa.Column("address", sa.Text(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_warehouses_id", "warehouses", ["id"])
    op.create_index("ix_warehouses_code", "warehouses", ["code"], unique=True)

    # 3. locations
    op.create_table(
        "locations",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("warehouse_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("code", sa.String(length=50), nullable=False),
        sa.Column("location_type", sa.String(length=50), nullable=False, server_default="INTERNAL"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["warehouse_id"], ["warehouses.id"], ondelete="RESTRICT"),
        sa.UniqueConstraint("warehouse_id", "code", name="uq_location_warehouse_code"),
    )
    op.create_index("ix_locations_id", "locations", ["id"])
    op.create_index("ix_locations_warehouse_id", "locations", ["warehouse_id"])
    op.create_index("ix_locations_code", "locations", ["code"])

    # 4. product_categories
    op.create_table(
        "product_categories",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("code", sa.String(length=50), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_product_categories_id", "product_categories", ["id"])
    op.create_index("ix_product_categories_name", "product_categories", ["name"], unique=True)

    # 5. products
    op.create_table(
        "products",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("sku", sa.String(length=100), nullable=False),
        sa.Column("category_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("unit_of_measure", sa.String(length=50), nullable=False, server_default="Units"),
        sa.Column("reorder_level", sa.Numeric(precision=15, scale=4), nullable=False, server_default="0.0000"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["category_id"], ["product_categories.id"], ondelete="SET NULL"),
    )
    op.create_index("ix_products_id", "products", ["id"])
    op.create_index("ix_products_sku", "products", ["sku"], unique=True)
    op.create_index("ix_products_category_id", "products", ["category_id"])

    # 6. suppliers
    op.create_table(
        "suppliers",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("code", sa.String(length=50), nullable=True),
        sa.Column("contact_email", sa.String(length=255), nullable=True),
        sa.Column("phone", sa.String(length=50), nullable=True),
        sa.Column("address", sa.Text(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_suppliers_id", "suppliers", ["id"])
    op.create_index("ix_suppliers_code", "suppliers", ["code"], unique=True)

    # 7. customers
    op.create_table(
        "customers",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("code", sa.String(length=50), nullable=True),
        sa.Column("contact_email", sa.String(length=255), nullable=True),
        sa.Column("phone", sa.String(length=50), nullable=True),
        sa.Column("address", sa.Text(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_customers_id", "customers", ["id"])
    op.create_index("ix_customers_code", "customers", ["code"], unique=True)

    # 8. stock_balances
    op.create_table(
        "stock_balances",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("product_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("location_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("quantity", sa.Numeric(precision=15, scale=4), nullable=False, server_default="0.0000"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["location_id"], ["locations.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"], ondelete="RESTRICT"),
        sa.UniqueConstraint("product_id", "location_id", name="uq_stock_balance_product_location"),
        sa.CheckConstraint("quantity >= 0", name="chk_stock_balance_quantity_non_negative"),
    )
    op.create_index("ix_stock_balances_id", "stock_balances", ["id"])
    op.create_index("ix_stock_balances_product_id", "stock_balances", ["product_id"])
    op.create_index("ix_stock_balances_location_id", "stock_balances", ["location_id"])

    # 9. stock_ledger
    op.create_table(
        "stock_ledger",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("product_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("location_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("transaction_type", sa.String(length=50), nullable=False),
        sa.Column("reference_type", sa.String(length=50), nullable=False),
        sa.Column("reference_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("quantity_before", sa.Numeric(precision=15, scale=4), nullable=False),
        sa.Column("quantity_change", sa.Numeric(precision=15, scale=4), nullable=False),
        sa.Column("quantity_after", sa.Numeric(precision=15, scale=4), nullable=False),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["location_id"], ["locations.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"], ondelete="SET NULL"),
    )
    op.create_index("ix_stock_ledger_id", "stock_ledger", ["id"])
    op.create_index("ix_stock_ledger_product_id", "stock_ledger", ["product_id"])
    op.create_index("ix_stock_ledger_location_id", "stock_ledger", ["location_id"])
    op.create_index("ix_stock_ledger_transaction_type", "stock_ledger", ["transaction_type"])
    op.create_index("ix_stock_ledger_reference_type", "stock_ledger", ["reference_type"])
    op.create_index("ix_stock_ledger_reference_id", "stock_ledger", ["reference_id"])
    op.create_index("ix_stock_ledger_created_at", "stock_ledger", ["created_at"])

    # 10. receipts
    op.create_table(
        "receipts",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("receipt_number", sa.String(length=100), nullable=False),
        sa.Column("supplier_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("destination_location_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("status", sa.String(length=50), nullable=False, server_default="DRAFT"),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("validated_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("validated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["supplier_id"], ["suppliers.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["destination_location_id"], ["locations.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["validated_by"], ["users.id"], ondelete="SET NULL"),
    )
    op.create_index("ix_receipts_id", "receipts", ["id"])
    op.create_index("ix_receipts_receipt_number", "receipts", ["receipt_number"], unique=True)
    op.create_index("ix_receipts_supplier_id", "receipts", ["supplier_id"])
    op.create_index("ix_receipts_destination_location_id", "receipts", ["destination_location_id"])
    op.create_index("ix_receipts_status", "receipts", ["status"])

    # 11. receipt_items
    op.create_table(
        "receipt_items",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("receipt_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("product_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("quantity", sa.Numeric(precision=15, scale=4), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["receipt_id"], ["receipts.id"], ondelete="CASCADE"),
        sa.CheckConstraint("quantity > 0", name="chk_receipt_item_quantity_positive"),
    )
    op.create_index("ix_receipt_items_id", "receipt_items", ["id"])
    op.create_index("ix_receipt_items_receipt_id", "receipt_items", ["receipt_id"])
    op.create_index("ix_receipt_items_product_id", "receipt_items", ["product_id"])

    # 12. delivery_orders
    op.create_table(
        "delivery_orders",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("delivery_number", sa.String(length=100), nullable=False),
        sa.Column("customer_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("source_location_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("status", sa.String(length=50), nullable=False, server_default="DRAFT"),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("validated_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("validated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["customer_id"], ["customers.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["source_location_id"], ["locations.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["validated_by"], ["users.id"], ondelete="SET NULL"),
    )
    op.create_index("ix_delivery_orders_id", "delivery_orders", ["id"])
    op.create_index("ix_delivery_orders_delivery_number", "delivery_orders", ["delivery_number"], unique=True)
    op.create_index("ix_delivery_orders_customer_id", "delivery_orders", ["customer_id"])
    op.create_index("ix_delivery_orders_source_location_id", "delivery_orders", ["source_location_id"])
    op.create_index("ix_delivery_orders_status", "delivery_orders", ["status"])

    # 13. delivery_items
    op.create_table(
        "delivery_items",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("delivery_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("product_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("quantity", sa.Numeric(precision=15, scale=4), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["delivery_id"], ["delivery_orders.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"], ondelete="RESTRICT"),
        sa.CheckConstraint("quantity > 0", name="chk_delivery_item_quantity_positive"),
    )
    op.create_index("ix_delivery_items_id", "delivery_items", ["id"])
    op.create_index("ix_delivery_items_delivery_id", "delivery_items", ["delivery_id"])
    op.create_index("ix_delivery_items_product_id", "delivery_items", ["product_id"])

    # 14. internal_transfers
    op.create_table(
        "internal_transfers",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("transfer_number", sa.String(length=100), nullable=False),
        sa.Column("source_location_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("destination_location_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("status", sa.String(length=50), nullable=False, server_default="DRAFT"),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("completed_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["destination_location_id"], ["locations.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["source_location_id"], ["locations.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["completed_by"], ["users.id"], ondelete="SET NULL"),
        sa.CheckConstraint(
            "source_location_id != destination_location_id",
            name="chk_transfer_different_locations",
        ),
    )
    op.create_index("ix_internal_transfers_id", "internal_transfers", ["id"])
    op.create_index("ix_internal_transfers_transfer_number", "internal_transfers", ["transfer_number"], unique=True)
    op.create_index("ix_internal_transfers_source_location_id", "internal_transfers", ["source_location_id"])
    op.create_index("ix_internal_transfers_destination_location_id", "internal_transfers", ["destination_location_id"])
    op.create_index("ix_internal_transfers_status", "internal_transfers", ["status"])

    # 15. internal_transfer_items
    op.create_table(
        "internal_transfer_items",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("transfer_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("product_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("quantity", sa.Numeric(precision=15, scale=4), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["transfer_id"], ["internal_transfers.id"], ondelete="CASCADE"),
        sa.CheckConstraint("quantity > 0", name="chk_transfer_item_quantity_positive"),
    )
    op.create_index("ix_internal_transfer_items_id", "internal_transfer_items", ["id"])
    op.create_index("ix_internal_transfer_items_transfer_id", "internal_transfer_items", ["transfer_id"])
    op.create_index("ix_internal_transfer_items_product_id", "internal_transfer_items", ["product_id"])

    # 16. inventory_adjustments
    op.create_table(
        "inventory_adjustments",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("adjustment_number", sa.String(length=100), nullable=False),
        sa.Column("product_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("location_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("previous_quantity", sa.Numeric(precision=15, scale=4), nullable=False),
        sa.Column("counted_quantity", sa.Numeric(precision=15, scale=4), nullable=False),
        sa.Column("difference", sa.Numeric(precision=15, scale=4), nullable=False),
        sa.Column("reason", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=50), nullable=False, server_default="DRAFT"),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("validated_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("validated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["location_id"], ["locations.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["validated_by"], ["users.id"], ondelete="SET NULL"),
        sa.CheckConstraint("counted_quantity >= 0", name="chk_adjustment_counted_non_negative"),
    )
    op.create_index("ix_inventory_adjustments_id", "inventory_adjustments", ["id"])
    op.create_index("ix_inventory_adjustments_adjustment_number", "inventory_adjustments", ["adjustment_number"], unique=True)
    op.create_index("ix_inventory_adjustments_product_id", "inventory_adjustments", ["product_id"])
    op.create_index("ix_inventory_adjustments_location_id", "inventory_adjustments", ["location_id"])
    op.create_index("ix_inventory_adjustments_status", "inventory_adjustments", ["status"])


def downgrade() -> None:
    op.drop_table("inventory_adjustments")
    op.drop_table("internal_transfer_items")
    op.drop_table("internal_transfers")
    op.drop_table("delivery_items")
    op.drop_table("delivery_orders")
    op.drop_table("receipt_items")
    op.drop_table("receipts")
    op.drop_table("stock_ledger")
    op.drop_table("stock_balances")
    op.drop_table("customers")
    op.drop_table("suppliers")
    op.drop_table("products")
    op.drop_table("product_categories")
    op.drop_table("locations")
    op.drop_table("warehouses")
    op.drop_table("password_reset_otps")
    op.drop_table("users")
