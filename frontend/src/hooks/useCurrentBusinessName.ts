import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";

import { businessesApi } from "@/api/businesses";

export function useCurrentBusinessName(): string | null {
  const { businessId } = useParams<{ businessId: string }>();

  const query = useQuery({
    queryKey: ["admin-businesses"],
    queryFn: businessesApi.getMine,
    enabled: Boolean(businessId),
  });

  if (!businessId) return null;
  return query.data?.find((b) => b.id === businessId)?.name ?? null;
}