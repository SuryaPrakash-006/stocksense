import { apiClient } from "@/lib/api-client";
import {
  DeliveryFilterParams,
  DeliveryOrder,
  DeliveryOrderCreatePayload,
  DeliveryOrderUpdatePayload,
  DeliveryPagination,
} from "@/types/delivery";

export const deliveryService = {
  async getDeliveries(params?: DeliveryFilterParams): Promise<DeliveryPagination> {
    const response = await apiClient.get<DeliveryPagination>("/deliveries", {
      params,
    });
    return response.data;
  },

  async getDeliveryById(id: string): Promise<DeliveryOrder> {
    const response = await apiClient.get<DeliveryOrder>(`/deliveries/${id}`);
    return response.data;
  },

  async createDelivery(payload: DeliveryOrderCreatePayload): Promise<DeliveryOrder> {
    const response = await apiClient.post<DeliveryOrder>("/deliveries", payload);
    return response.data;
  },

  async updateDelivery(
    id: string,
    payload: DeliveryOrderUpdatePayload
  ): Promise<DeliveryOrder> {
    const response = await apiClient.put<DeliveryOrder>(`/deliveries/${id}`, payload);
    return response.data;
  },

  async validateDelivery(id: string): Promise<DeliveryOrder> {
    const response = await apiClient.post<DeliveryOrder>(`/deliveries/${id}/validate`);
    return response.data;
  },

  async cancelDelivery(id: string): Promise<DeliveryOrder> {
    const response = await apiClient.post<DeliveryOrder>(`/deliveries/${id}/cancel`);
    return response.data;
  },
};
