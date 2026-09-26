import { Supplier } from "@/types/partner";
import { ProductListItem } from "@/types/product";
import { Location } from "@/types/warehouse";

export type DocumentStatus = "DRAFT" | "WAITING" | "READY" | "DONE" | "CANCELED";

export interface ReceiptItem {
  id: string;
  receipt_id: string;
  product_id: string;
  quantity: string | number;
  created_at: string;
  updated_at: string;
  product?: ProductListItem | null;
}

export interface ReceiptItemInput {
  product_id: string;
  quantity: string | number;
}

export interface Receipt {
  id: string;
  receipt_number: string;
  supplier_id: string;
  destination_location_id: string;
  status: DocumentStatus;
  notes?: string | null;
  created_by: string;
  validated_by?: string | null;
  validated_at?: string | null;
  created_at: string;
  updated_at: string;
  supplier?: Supplier | null;
  destination_location?: Location | null;
  items: ReceiptItem[];
  total_items: number;
  total_quantity: string | number;
  created_by_name?: string | null;
  validated_by_name?: string | null;
}

export interface ReceiptCreatePayload {
  receipt_number?: string;
  supplier_id: string;
  destination_location_id: string;
  notes?: string;
  items: ReceiptItemInput[];
}

export interface ReceiptUpdatePayload {
  supplier_id?: string;
  destination_location_id?: string;
  notes?: string;
  status?: DocumentStatus;
  items?: ReceiptItemInput[];
}

export interface ReceiptPagination {
  items: Receipt[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export interface ReceiptFilterParams {
  search?: string;
  status?: DocumentStatus;
  supplier_id?: string;
  destination_location_id?: string;
  warehouse_id?: string;
  page?: number;
  page_size?: number;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}
