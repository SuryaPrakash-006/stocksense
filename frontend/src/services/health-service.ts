import { apiClient } from "@/lib/api-client";
import { HealthResponse } from "@/types/health";

export const healthService = {
  async getHealth(): Promise<HealthResponse> {
    const response = await apiClient.get<HealthResponse>("/health");
    return response.data;
  },
};
