export interface DatabaseStatus {
  connected: boolean;
  latency_ms: number;
  error?: string | null;
}

export interface HealthResponse {
  status: "healthy" | "degraded" | "unhealthy";
  project_name: string;
  environment: string;
  version: string;
  timestamp: string;
  database: DatabaseStatus;
}
