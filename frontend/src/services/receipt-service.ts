import { apiClient } from "@/lib/api-client";
import {
  Receipt,
  ReceiptCreatePayload,
  ReceiptFilterParams,
  ReceiptPagination,
  ReceiptUpdatePayload,
} from "@/types/receipt";

export const receiptService = {
  async getReceipts(params?: ReceiptFilterParams): Promise<ReceiptPagination> {
    const response = await apiClient.get<ReceiptPagination>("/receipts", {
      params,
    });
    return response.data;
  },

  async getReceiptById(id: string): Promise<Receipt> {
    const response = await apiClient.get<Receipt>(`/receipts/${id}`);
    return response.data;
  },

  async createReceipt(payload: ReceiptCreatePayload): Promise<Receipt> {
    const response = await apiClient.post<Receipt>("/receipts", payload);
    return response.data;
  },

  async updateReceipt(id: string, payload: ReceiptUpdatePayload): Promise<Receipt> {
    const response = await apiClient.put<Receipt>(`/receipts/${id}`, payload);
    return response.data;
  },

  async validateReceipt(id: string): Promise<Receipt> {
    const response = await apiClient.post<Receipt>(`/receipts/${id}/validate`);
    return response.data;
  },

  async cancelReceipt(id: string): Promise<Receipt> {
    const response = await apiClient.post<Receipt>(`/receipts/${id}/cancel`);
    return response.data;
  },
};
