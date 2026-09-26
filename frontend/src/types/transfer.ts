import { Location } from "@/types/warehouse";
import { ProductListItem } from "@/types/product";
import { DocumentStatus } from "@/types/receipt";

export interface InternalTransferItem {
  id: string;
  transfer_id: string;
  product_id: string;
  quantity: string | number;
  created_at: string;
  updated_at: string;
  product?: ProductListItem | null;
  available_stock?: string | number;
  is_sufficient?: boolean;
}

export interface InternalTransferItemInput {
  product_id: string;
  quantity: string | number;
}

export interface InternalTransfer {
  id: string;
  transfer_number: string;
  source_location_id: string;
  destination_location_id: string;
  status: DocumentStatus;
  notes?: string | null;
  created_by: string;
  completed_by?: string | null;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
  source_location?: Location | null;
  destination_location?: Location | null;
  items: InternalTransferItem[];
  total_items: number;
  total_quantity: string | number;
  created_by_name?: string | null;
  completed_by_name?: string | null;
  has_sufficient_stock?: boolean;
}

export interface InternalTransferCreatePayload {
  transfer_number?: string;
  source_location_id: string;
  destination_location_id: string;
  notes?: string;
  items: InternalTransferItemInput[];
}

export interface InternalTransferUpdatePayload {
  source_location_id?: string;
  destination_location_id?: string;
  notes?: string;
  status?: DocumentStatus;
  items?: InternalTransferItemInput[];
}

export interface InternalTransferPagination {
  items: InternalTransfer[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export interface TransferFilterParams {
  search?: string;
  status?: DocumentStatus;
  source_location_id?: string;
  destination_location_id?: string;
  warehouse_id?: string;
  page?: number;
  page_size?: number;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}
