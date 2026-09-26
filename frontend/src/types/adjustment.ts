import { ProductListItem } from "@/types/product";
import { Location } from "@/types/warehouse";

export type AdjustmentStatus = "DRAFT" | "DONE" | "CANCELED";

export interface InventoryAdjustment {
  id: string;
  adjustment_number: string;
  product_id: string;
  location_id: string;
  previous_quantity: string | number;
  counted_quantity: string | number;
  difference: string | number;
  reason?: string | null;
  status: AdjustmentStatus;
  created_by: string;
  validated_by?: string | null;
  validated_at?: string | null;
  created_at: string;
  updated_at: string;
  product?: ProductListItem | null;
  location?: Location | null;
  created_by_name?: string | null;
  validated_by_name?: string | null;
}

export interface InventoryAdjustmentCreatePayload {
  adjustment_number?: string;
  product_id: string;
  location_id: string;
  counted_quantity: string | number;
  reason?: string;
}

export interface InventoryAdjustmentPagination {
  items: InventoryAdjustment[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export interface AdjustmentFilterParams {
  search?: string;
  status?: AdjustmentStatus;
  product_id?: string;
  location_id?: string;
  warehouse_id?: string;
  page?: number;
  page_size?: number;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}
