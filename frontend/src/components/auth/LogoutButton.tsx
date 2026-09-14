import { useState } from "react";
import { LogOut, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { authApi } from "../../api/auth";
import { queryClient } from "../../lib/query-client";
import { useAuthStore } from "../../stores/auth.store";
import { Button } from "../ui/button";

export function LogoutButton() {
  const navigate = useNavigate();

  const refreshToken = useAuthStore(
    (state) => state.refreshToken,
  );

  const clearAuth = useAuthStore(
    (state) => state.clearAuth,
  );

  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    if (isLoading) {
      return;
    }

    setIsLoading(true);

    try {
      if (refreshToken) {
        await authApi.logout(refreshToken);
      }
    } catch {
      // Local authentication state must still be cleared.
    } finally {
      queryClient.clear();
      clearAuth();

      navigate("/login", {
        replace: true,
      });
    }
  };

  return (
    <Button
      type="button"
      variant="ghost"
      onClick={handleLogout}
      disabled={isLoading}
      className="gap-2"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <LogOut className="h-4 w-4" />
      )}

      {isLoading ? "Signing out..." : "Sign out"}
    </Button>
  );
}