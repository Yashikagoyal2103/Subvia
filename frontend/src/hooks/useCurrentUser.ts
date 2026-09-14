import { useQuery } from "@tanstack/react-query";
import { authApi } from "../api/auth";
import { useAuthStore } from "../stores/auth.store";

export function useCurrentUser() {
  const accessToken = useAuthStore(
    (state) => state.accessToken,
  );

  const isInitialized = useAuthStore(
    (state) => state.isInitialized,
  );

  return useQuery({
    queryKey: ["current-user"],
    queryFn: authApi.me,
    enabled: Boolean(accessToken) && !isInitialized,
    retry: false,
  });
}