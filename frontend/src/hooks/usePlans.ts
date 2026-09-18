import { useQuery } from "@tanstack/react-query";
import { plansApi } from "../api/plans";

export function usePlans(
  businessId: string,
  serviceId: string,
) {
  return useQuery({
    queryKey: ["plans", businessId, serviceId],
    queryFn: () => plansApi.list(businessId, serviceId),
    enabled: Boolean(businessId && serviceId),
  });
}