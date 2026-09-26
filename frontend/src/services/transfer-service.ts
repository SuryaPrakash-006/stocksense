import { apiClient } from "@/lib/api-client";
import {
  InternalTransfer,
  InternalTransferCreatePayload,
  InternalTransferPagination,
  InternalTransferUpdatePayload,
  TransferFilterParams,
} from "@/types/transfer";

export const transferService = {
  listTransfers: async (
    params: TransferFilterParams = {}
  ): Promise<InternalTransferPagination> => {
    const response = await apiClient.get<InternalTransferPagination>("/transfers", {
      params,
    });
    return response.data;
  },

  getTransferById: async (id: string): Promise<InternalTransfer> => {
    const response = await apiClient.get<InternalTransfer>(`/transfers/${id}`);
    return response.data;
  },

  createTransfer: async (
    payload: InternalTransferCreatePayload
  ): Promise<InternalTransfer> => {
    const response = await apiClient.post<InternalTransfer>("/transfers", payload);
    return response.data;
  },

  updateTransfer: async (
    id: string,
    payload: InternalTransferUpdatePayload
  ): Promise<InternalTransfer> => {
    const response = await apiClient.put<InternalTransfer>(`/transfers/${id}`, payload);
    return response.data;
  },

  validateTransfer: async (id: string): Promise<InternalTransfer> => {
    const response = await apiClient.post<InternalTransfer>(`/transfers/${id}/validate`);
    return response.data;
  },

  cancelTransfer: async (id: string): Promise<InternalTransfer> => {
    const response = await apiClient.post<InternalTransfer>(`/transfers/${id}/cancel`);
    return response.data;
  },
};
