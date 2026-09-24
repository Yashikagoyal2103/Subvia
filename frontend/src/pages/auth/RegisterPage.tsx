import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Loader2,
  Receipt,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { authApi } from "../../api/auth";
import { useAuthStore } from "../../stores/auth.store";
import { AuthBrandPanel } from "../../components/auth/AuthBrandPanel";

export function RegisterPage() {
  const navigate = useNavigate();
  const { setTokens, setUser, setInitialized, clearAuth } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [formError, setFormError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const validate = () => {
    let ok = true;
    setEmailError("");
    setPasswordError("");
    setConfirmPasswordError("");
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

    if (!confirmPassword) {
      setConfirmPasswordError("Please confirm your password.");
      ok = false;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match.");
      ok = false;
    }

    return ok;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      // 1. Create the account
      await authApi.register({ email, password });

      // 2. Immediately sign in with the same credentials (auto-login)
      const tokens = await authApi.login({ email, password });
      setTokens(tokens.accessToken, tokens.refreshToken);

      const user = await authApi.me();
      setUser(user.userId);
      setInitialized(true);

      // 3. Straight to workspace
      navigate("/workspace", { replace: true });
    } catch (error) {
      clearAuth();
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.error?.message;
        setFormError(message ?? "Unable to create your account. Please try again.");
      } else {
        setFormError("Unable to create your account. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <AuthBrandPanel
        headline="Create your workspace."
        supporting="Start managing subscriptions, invoices and payments for your business in one place."
        bullets={[
          {
            icon: Sparkles,
            title: "Subscriptions",
            description: "Activate, upgrade, downgrade, cancel — all tracked.",
          },
          {
            icon: Receipt,
            title: "Invoices & Payments",
            description: "Automatic, tax-aware, multi-currency documents.",
          },
          {
            icon: ShieldCheck,
            title: "Tenant isolation",
            description: "Each business is a separate, secure workspace.",
          },
        ]}
      />

      <main className="app-canvas flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-20">
        <div className="mx-auto w-full max-w-[400px]">
          <div className="mb-10 flex items-center gap-2.5 lg:hidden">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-ink)] text-[13px] font-bold text-[var(--color-accent)]">
              SB
            </span>
            <span className="text-sm font-semibold tracking-tight text-[var(--color-ink)]">
              SaaS Billing
            </span>
          </div>

          <div className="rounded-3xl border border-[var(--color-border-soft)] bg-white p-7 shadow-[var(--shadow-card)] sm:p-8">
            <div className="mb-6">
              <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-ink)]">
                Create your account
              </h1>
              <p className="mt-1.5 text-sm text-[var(--color-ink-muted)]">
                Sign up and start managing your billing.
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
                    placeholder="At least 8 characters"
                    autoComplete="new-password"
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

              <div className="space-y-1.5">
                <label
                  htmlFor="confirmPassword"
                  className="block text-xs font-semibold text-[var(--color-ink)]"
                >
                  Confirm password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isLoading}
                    placeholder="Repeat your password"
                    autoComplete="new-password"
                    className={`h-11 w-full rounded-xl border bg-[var(--color-surface)] pl-3.5 pr-11 text-sm text-[var(--color-ink)] outline-none transition placeholder:text-[var(--color-ink-subtle)] focus:ring-4 disabled:opacity-60 ${
                      confirmPasswordError
                        ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
                        : "border-[var(--color-border-soft)] focus:border-[var(--color-ink)] focus:ring-[var(--color-accent)]/25"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    disabled={isLoading}
                    aria-label={
                      showConfirmPassword ? "Hide password" : "Show password"
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-subtle)] transition hover:text-[var(--color-ink)]"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {confirmPasswordError ? (
                  <p className="text-xs text-rose-600">{confirmPasswordError}</p>
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
                    Creating account…
                  </>
                ) : (
                  "Create account"
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-xs text-[var(--color-ink-muted)]">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-semibold text-[var(--color-ink)] underline decoration-[var(--color-border-strong)] underline-offset-4 hover:decoration-[var(--color-ink)]"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}