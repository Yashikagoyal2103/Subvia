import { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import {
  Check,
  Eye,
  EyeOff,
  Loader2,
  Webhook,
} from "lucide-react";
import { AppLogo } from "../../components/app-logo";
import { authApi, type RegistrationIntent } from "../../api/auth";
import { useAuthStore } from "../../stores/auth.store";
import { AuthBrandPanel } from "../../components/auth/AuthBrandPanel";

export function RegisterPage() {
  const navigate = useNavigate();

  const { setTokens, setUser, setInitialized, clearAuth } = useAuthStore();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [intent, setIntent] = useState<RegistrationIntent>("CUSTOMER");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [firstNameError, setFirstNameError] = useState("");
  const [lastNameError, setLastNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [formError, setFormError] = useState("");

  const [isLoading, setIsLoading] = useState(false);

  const validate = () => {
    let ok = true;

    setFirstNameError("");
    setLastNameError("");
    setEmailError("");
    setPasswordError("");
    setConfirmPasswordError("");
    setFormError("");

    if (!firstName.trim()) {
      setFirstNameError("First name is required.");
      ok = false;
    } else if (firstName.trim().length < 2) {
      setFirstNameError("First name must be at least 2 characters.");
      ok = false;
    }

    if (!lastName.trim()) {
      setLastNameError("Last name is required.");
      ok = false;
    } else if (lastName.trim().length < 2) {
      setLastNameError("Last name must be at least 2 characters.");
      ok = false;
    }

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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validate()) return;

    setIsLoading(true);

    try {
      // 1. Create the account — response already contains the full user.
      const user = await authApi.register({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        password,
        confirmPassword,
        intent,
      });

      // 2. Establish a session with the same credentials.
      const tokens = await authApi.login({
        email: email.trim(),
        password,
      });

      setTokens(tokens.accessToken, tokens.refreshToken);
      setUser(user);
      setInitialized(true);

      // 3. Route based on the chosen intent.
      if (intent === "ADMIN") {
        navigate("/onboarding/create-business", {
          replace: true,
        });
      } else {
        navigate("/customer", {
          replace: true,
        });
      }
    } catch (error) {
      clearAuth();

      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.error?.message;
        setFormError(
          message ?? "Unable to create your account. Please try again.",
        );
      } else {
        setFormError("Unable to create your account. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <AuthBrandPanel intent={intent} />

      <main className="app-canvas flex flex-col justify-center px-6 py-10 sm:px-12 lg:px-20">
        <div className="mx-auto w-full max-w-[440px]">
          <div className="mb-8 lg:hidden">
            <div className="mb-8 lg:hidden">
              <AppLogo
                variant="wordmark"
                className="h-9"
                alt="Subvia"
              />
            </div>
          </div>

          <div className="rounded-3xl border border-[var(--color-border-soft)] bg-white p-7 shadow-[var(--shadow-card)] sm:p-8">
            <div className="mb-6">
              <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-ink)]">
                Create your account
              </h1>
              <p className="mt-1.5 text-sm text-[var(--color-ink-muted)]">
                Set up your account to get started.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {formError ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-700">
                  {formError}
                </div>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  id="firstName"
                  label="First name"
                  value={firstName}
                  onChange={setFirstName}
                  error={firstNameError}
                  disabled={isLoading}
                  placeholder="John"
                  autoComplete="given-name"
                />
                <Field
                  id="lastName"
                  label="Last name"
                  value={lastName}
                  onChange={setLastName}
                  error={lastNameError}
                  disabled={isLoading}
                  placeholder="Doe"
                  autoComplete="family-name"
                />
              </div>

              <Field
                id="email"
                label="Email"
                value={email}
                onChange={setEmail}
                error={emailError}
                disabled={isLoading}
                placeholder="you@example.com"
                autoComplete="email"
              />

              <div className="space-y-2">
                <span className="block text-xs font-semibold text-[var(--color-ink)]">
                  How will you use Subvia?
                </span>

                <div className="grid gap-3 sm:grid-cols-2">
                  <AccountTypeCard
                    selected={intent === "ADMIN"}
                    title="Run a business"
                    description="Create services and pricing plans, and manage customer billing, invoices and payments."
                    onClick={() => setIntent("ADMIN")}
                    disabled={isLoading}
                  />
                  <AccountTypeCard
                    selected={intent === "CUSTOMER"}
                    title="Subscribe as a customer"
                    description="Browse services from a business and manage your own subscriptions and invoices."
                    onClick={() => setIntent("CUSTOMER")}
                    disabled={isLoading}
                  />
                </div>

                {intent === "ADMIN" ? (
                  <div className="flex items-start gap-2.5 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface)] px-3.5 py-3">
                    <Webhook className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-ink-muted)]" />
                    <p className="text-[11px] leading-5 text-[var(--color-ink-muted)]">
                      Your business workspace includes signed webhook delivery with automatic retries for subscription lifecycle events.
                    </p>
                  </div>
                ) : null}
              </div>

              <PasswordField
                id="password"
                label="Password"
                value={password}
                onChange={setPassword}
                show={showPassword}
                setShow={setShowPassword}
                error={passwordError}
                disabled={isLoading}
                placeholder="At least 8 characters"
                autoComplete="new-password"
              />

              <PasswordField
                id="confirmPassword"
                label="Confirm password"
                value={confirmPassword}
                onChange={setConfirmPassword}
                show={showConfirmPassword}
                setShow={setShowConfirmPassword}
                error={confirmPasswordError}
                disabled={isLoading}
                placeholder="Repeat your password"
                autoComplete="new-password"
              />

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

/* ───────────────────────── Sub-components ───────────────────────── */

interface FieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error: string;
  disabled: boolean;
  placeholder: string;
  autoComplete?: string;
}

function Field({
  id,
  label,
  value,
  onChange,
  error,
  disabled,
  placeholder,
  autoComplete,
}: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="block text-xs font-semibold text-[var(--color-ink)]"
      >
        {label}
      </label>
      <input
        id={id}
        type={id === "email" ? "email" : "text"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={`h-11 w-full rounded-xl border bg-[var(--color-surface)] px-3.5 text-sm text-[var(--color-ink)] outline-none transition placeholder:text-[var(--color-ink-subtle)] focus:ring-4 disabled:opacity-60 ${
          error
            ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
            : "border-[var(--color-border-soft)] focus:border-[var(--color-ink)] focus:ring-[var(--color-accent)]/25"
        }`}
      />
      {error ? <p className="text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}

interface PasswordFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  show: boolean;
  setShow: (value: boolean) => void;
  error: string;
  disabled: boolean;
  placeholder: string;
  autoComplete?: string;
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  show,
  setShow,
  error,
  disabled,
  placeholder,
  autoComplete,
}: PasswordFieldProps) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="block text-xs font-semibold text-[var(--color-ink)]"
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={`h-11 w-full rounded-xl border bg-[var(--color-surface)] pl-3.5 pr-11 text-sm text-[var(--color-ink)] outline-none transition placeholder:text-[var(--color-ink-subtle)] focus:ring-4 disabled:opacity-60 ${
            error
              ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
              : "border-[var(--color-border-soft)] focus:border-[var(--color-ink)] focus:ring-[var(--color-accent)]/25"
          }`}
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          disabled={disabled}
          aria-label={show ? "Hide password" : "Show password"}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-subtle)] transition hover:text-[var(--color-ink)]"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {error ? <p className="text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}

interface AccountTypeCardProps {
  selected: boolean;
  title: string;
  description: string;
  onClick: () => void;
  disabled: boolean;
}

function AccountTypeCard({
  selected,
  title,
  description,
  onClick,
  disabled,
}: AccountTypeCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={`relative rounded-2xl border p-4 text-left transition disabled:opacity-60 ${
        selected
          ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10 ring-2 ring-[var(--color-accent)]/25"
          : "border-[var(--color-border-soft)] bg-[var(--color-surface)] hover:border-[var(--color-border-strong)]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold text-[var(--color-ink)]">
          {title}
        </p>
        {selected ? (
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent)] text-[var(--color-accent-foreground)]">
            <Check className="h-3 w-3" strokeWidth={3} />
          </span>
        ) : null}
      </div>
      <p className="mt-1 text-xs leading-relaxed text-[var(--color-ink-muted)]">
        {description}
      </p>
    </button>
  );
}
