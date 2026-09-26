import enum


class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    INVENTORY_MANAGER = "INVENTORY_MANAGER"
    WAREHOUSE_STAFF = "WAREHOUSE_STAFF"


class LocationType(str, enum.Enum):
    INTERNAL = "INTERNAL"          # Standard storage (racks, shelves, aisles)
    RECEIVING = "RECEIVING"        # Inbound staging area
    SHIPPING = "SHIPPING"          # Outbound dispatch area
    PRODUCTION = "PRODUCTION"      # Production / Assembly floor
    TRANSIT = "TRANSIT"            # In-transit location
    SCRAP = "SCRAP"                # Damaged / Written-off items


class DocumentStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    WAITING = "WAITING"
    READY = "READY"
    DONE = "DONE"
    CANCELED = "CANCELED"


class AdjustmentStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    DONE = "DONE"
    CANCELED = "CANCELED"


class TransactionType(str, enum.Enum):
    RECEIPT = "RECEIPT"
    DELIVERY = "DELIVERY"
    TRANSFER_IN = "TRANSFER_IN"
    TRANSFER_OUT = "TRANSFER_OUT"
    ADJUSTMENT = "ADJUSTMENT"
