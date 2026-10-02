import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { subscriptionsApi } from "@/api/subscriptions";
import { createIdempotencyKey } from "@/lib/idempotency";

export function useSubscriptions() {
  const queryClient = useQueryClient();

  const subscriptionsQuery = useQuery({
    queryKey: ["customer-subscriptions"],
    queryFn: () => subscriptionsApi.list(),
  });

  const cancelMutation = useMutation({
    mutationFn: ({
      subscriptionId,
      mode,
    }: {
      subscriptionId: string;
      mode: "PERIOD_END" | "IMMEDIATE";
    }) => subscriptionsApi.cancel(
      subscriptionId,
      { mode },
      createIdempotencyKey(),
    ),

    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["customer-subscriptions"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["customer-subscription", variables.subscriptionId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["customer-subscription-events", variables.subscriptionId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["customer-credits"],
        }),
      ]);
    },
  });

  return {
    ...subscriptionsQuery,
    subscriptions: subscriptionsQuery.data ?? [],
    cancel: cancelMutation.mutateAsync,
    cancelPending: cancelMutation.isPending,
  };
}
