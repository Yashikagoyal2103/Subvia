import { useQuery } from "@tanstack/react-query";
import {
  subscriptionsApi,
} from "../api/subscriptions";

export function useSubscriptions(
  businessId: string,
) {
  return useQuery({
    queryKey: [
      "subscriptions",
      businessId,
    ],
    queryFn: () =>
      subscriptionsApi.list(
        businessId,
      ),
    enabled: Boolean(businessId),
  });
}

export function useSubscription(
  businessId: string,
  subscriptionId: string,
) {
  return useQuery({
    queryKey: [
      "subscription",
      businessId,
      subscriptionId,
    ],
    queryFn: () =>
      subscriptionsApi.getById(
        businessId,
        subscriptionId,
      ),
    enabled:
      Boolean(businessId) &&
      Boolean(subscriptionId),
  });
}