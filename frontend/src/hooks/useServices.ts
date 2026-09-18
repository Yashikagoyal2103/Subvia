import { useQuery } from "@tanstack/react-query";
import { servicesApi } from "../api/services";

export function useServices(businessId: string) {
  return useQuery({
    queryKey: ["services", businessId],
    queryFn: () => servicesApi.list(businessId),
    enabled: Boolean(businessId),
  });
}