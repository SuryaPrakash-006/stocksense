import { Customer } from "@/types/partner";
import { ProductListItem } from "@/types/product";
import { Location } from "@/types/warehouse";
import { DocumentStatus } from "@/types/receipt";

export interface DeliveryItem {
  id: string;
  delivery_id: string;
  product_id: string;
  quantity: string | number;
  created_at: string;
  updated_at: string;
  product?: ProductListItem | null;
  available_stock?: string | number;
  is_sufficient?: boolean;
}

export interface DeliveryItemInput {
  product_id: string;
  quantity: string | number;
}

export interface DeliveryOrder {
  id: string;
  delivery_number: string;
  customer_id: string;
  source_location_id: string;
  status: DocumentStatus;
  notes?: string | null;
  created_by: string;
  validated_by?: string | null;
  validated_at?: string | null;
  created_at: string;
  updated_at: string;
  customer?: Customer | null;
  source_location?: Location | null;
  items: DeliveryItem[];
  total_items: number;
  total_quantity: string | number;
  created_by_name?: string | null;
  validated_by_name?: string | null;
  has_sufficient_stock?: boolean;
}

export interface DeliveryOrderCreatePayload {
  delivery_number?: string;
  customer_id: string;
  source_location_id: string;
  notes?: string;
  items: DeliveryItemInput[];
}

export interface DeliveryOrderUpdatePayload {
  customer_id?: string;
  source_location_id?: string;
  notes?: string;
  status?: DocumentStatus;
  items?: DeliveryItemInput[];
}

export interface DeliveryPagination {
  items: DeliveryOrder[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export interface DeliveryFilterParams {
  search?: string;
  status?: DocumentStatus;
  customer_id?: string;
  source_location_id?: string;
  warehouse_id?: string;
  page?: number;
  page_size?: number;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}
