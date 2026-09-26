import { apiClient } from "@/lib/api-client";
import {
  AdjustmentFilterParams,
  InventoryAdjustment,
  InventoryAdjustmentCreatePayload,
  InventoryAdjustmentPagination,
} from "@/types/adjustment";

export const adjustmentService = {
  listAdjustments: async (
    params: AdjustmentFilterParams = {}
  ): Promise<InventoryAdjustmentPagination> => {
    const response = await apiClient.get<InventoryAdjustmentPagination>("/adjustments", {
      params,
    });
    return response.data;
  },

  getAdjustmentById: async (id: string): Promise<InventoryAdjustment> => {
    const response = await apiClient.get<InventoryAdjustment>(`/adjustments/${id}`);
    return response.data;
  },

  createAdjustment: async (
    payload: InventoryAdjustmentCreatePayload
  ): Promise<InventoryAdjustment> => {
    const response = await apiClient.post<InventoryAdjustment>("/adjustments", payload);
    return response.data;
  },

  validateAdjustment: async (id: string): Promise<InventoryAdjustment> => {
    const response = await apiClient.post<InventoryAdjustment>(`/adjustments/${id}/validate`);
    return response.data;
  },

  applyAdjustment: async (id: string): Promise<InventoryAdjustment> => {
    const response = await apiClient.post<InventoryAdjustment>(`/adjustments/${id}/validate`);
    return response.data;
  },

  getRecordedStock: async (
    productId: string,
    locationId: string
  ): Promise<{ product_id: string; location_id: string; recorded_quantity: number | string }> => {
    const response = await apiClient.get("/adjustments/stock-lookup", {
      params: {
        product_id: productId,
        location_id: locationId,
      },
    });
    return response.data;
  },

  cancelAdjustment: async (id: string): Promise<InventoryAdjustment> => {
    const response = await apiClient.post<InventoryAdjustment>(`/adjustments/${id}/cancel`);
    return response.data;
  },
};
