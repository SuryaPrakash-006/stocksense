import { useQuery } from "@tanstack/react-query";
import { healthService } from "@/services/health-service";

export function useHealth(refetchInterval: number = 5000) {
  return useQuery({
    queryKey: ["health"],
    queryFn: () => healthService.getHealth(),
    refetchInterval,
    retry: 2,
  });
}
