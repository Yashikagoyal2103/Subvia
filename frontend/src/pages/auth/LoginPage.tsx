import { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";

import { authApi } from "../../api/auth";
import { useAuthStore } from "../../stores/auth.store";
import { AuthBrandPanel } from "../../components/auth/AuthBrandPanel";

export function LoginPage() {
  const navigate = useNavigate();

  const {
    setTokens,
    setUser,
    setInitialized,
    clearAuth,
  } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [formError, setFormError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const validate = () => {
    let ok = true;

    setEmailError("");
    setPasswordError("");
    setFormError("");

    if (!email) {
      setEmailError("Email is required.");
      ok = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("Please enter a valid email address.");
      ok = false;
    }

    if (!password) {
      setPasswordError("Password is required.");
      ok = false;
    } else if (password.length < 8) {
      setPasswordError("Password must be at least 8 characters.");
      ok = false;
    }

    return ok;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validate()) return;

    setIsLoading(true);

    try {
      const tokens = await authApi.login({
        email: email.trim(),
        password,
      });

      setTokens(tokens.accessToken, tokens.refreshToken);

      const user = await authApi.me();
      setUser(user);
      setInitialized(true);

      navigate(
        user.accountType === "CUSTOMER"
          ? "/customer/dashboard"
          : "/workspace",
        { replace: true },
      );
    } catch (error) {
      clearAuth();

      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.error?.message;
        setFormError(message ?? "Unable to sign in. Please try again.");
      } else {
        setFormError("Unable to sign in. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <AuthBrandPanel
        headline="Welcome back."
        supporting="Log in to manage your billing workspace."
      />

      <main className="app-canvas flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-20">
        <div className="mx-auto w-full max-w-[400px]">
          <div className="mb-10 flex items-center gap-2.5 lg:hidden">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-ink)] text-[13px] font-bold text-[var(--color-accent)]">
              B
            </span>
            <span className="text-sm font-semibold tracking-tight text-[var(--color-ink)]">
              BillingOS
            </span>
          </div>

          <div className="rounded-3xl border border-[var(--color-border-soft)] bg-white p-7 shadow-[var(--shadow-card)] sm:p-8">
            <div className="mb-6">
              <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-ink)]">
                Sign in
              </h1>
              <p className="mt-1.5 text-sm text-[var(--color-ink-muted)]">
                Use your email and password to continue.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {formError ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-700">
                  {formError}
                </div>
              ) : null}

              <div className="space-y-1.5">
                <label
                  htmlFor="email"
                  className="block text-xs font-semibold text-[var(--color-ink)]"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  placeholder="you@example.com"
                  autoComplete="email"
                  autoFocus
                  className={`h-11 w-full rounded-xl border bg-[var(--color-surface)] px-3.5 text-sm text-[var(--color-ink)] outline-none transition placeholder:text-[var(--color-ink-subtle)] focus:ring-4 disabled:opacity-60 ${
                    emailError
                      ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
                      : "border-[var(--color-border-soft)] focus:border-[var(--color-ink)] focus:ring-[var(--color-accent)]/25"
                  }`}
                />
                {emailError ? (
                  <p className="text-xs text-rose-600">{emailError}</p>
                ) : null}
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold text-[var(--color-ink)]"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className={`h-11 w-full rounded-xl border bg-[var(--color-surface)] pl-3.5 pr-11 text-sm text-[var(--color-ink)] outline-none transition placeholder:text-[var(--color-ink-subtle)] focus:ring-4 disabled:opacity-60 ${
                      passwordError
                        ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
                        : "border-[var(--color-border-soft)] focus:border-[var(--color-ink)] focus:ring-[var(--color-accent)]/25"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    disabled={isLoading}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-subtle)] transition hover:text-[var(--color-ink)]"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {passwordError ? (
                  <p className="text-xs text-rose-600">{passwordError}</p>
                ) : null}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="mt-2 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[var(--color-accent)] text-sm font-semibold text-[var(--color-accent-foreground)] transition hover:brightness-105 disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Signing in…
                  </>
                ) : (
                  "Sign in"
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-xs text-[var(--color-ink-muted)]">
              Don&apos;t have an account?{" "}
              <Link
                to="/register"
                className="font-semibold text-[var(--color-ink)] underline decoration-[var(--color-border-strong)] underline-offset-4 hover:decoration-[var(--color-ink)]"
              >
                Create one
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}