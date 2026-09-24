import { useEffect, type ReactNode } from "react";
import { Loader2 } from "lucide-react";

import { useCurrentUser } from "../../hooks/useCurrentUser";
import { useAuthStore } from "../../stores/auth.store";

interface AuthInitializerProps {
  children: ReactNode;
}

export function AuthInitializer({
  children,
}: AuthInitializerProps) {
  const {
    accessToken,
    isInitialized,
    setUser,
    setInitialized,
    clearAuth,
  } = useAuthStore();

  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useCurrentUser(Boolean(accessToken));

  useEffect(() => {
    if (!accessToken) {
      setInitialized(true);
      return;
    }

    if (data) {
      setUser(data);
      setInitialized(true);
      return;
    }

    if (isError) {
      clearAuth();
    }
  }, [
    accessToken,
    data,
    isError,
    setUser,
    setInitialized,
    clearAuth,
  ]);

  if (!isInitialized && isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!isInitialized && isError) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="text-center">
          <h1 className="text-lg font-semibold">
            Unable to verify your session
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Your session could not be verified.
          </p>

          <button
            type="button"
            onClick={() => refetch()}
            className="mt-4 rounded-md bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-[var(--color-accent-foreground)]"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}