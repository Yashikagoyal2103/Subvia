import { useQuery } from "@tanstack/react-query";

import { authApi } from "../api/auth";

export function useCurrentUser(enabled = true) {
  return useQuery({
    queryKey: ["current-user"],
    queryFn: authApi.me,
    enabled,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}