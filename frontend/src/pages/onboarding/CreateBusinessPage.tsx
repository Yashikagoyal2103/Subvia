import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Building2, Check, CreditCard, Loader2, Receipt, Sparkles } from "lucide-react";

import { businessesApi } from "../../api/businesses";
import { useAuthStore } from "../../stores/auth.store";

export function CreateBusinessPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const [name, setName] = useState("");
  const [nameError, setNameError] = useState("");
  const [formError, setFormError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [createdId, setCreatedId] = useState<string | null>(null);
  const [createdName, setCreatedName] = useState<string>("");

  const validate = () => {
    let ok = true;
    setNameError("");
    setFormError("");

    const trimmed = name.trim();
    if (!trimmed) {
      setNameError("Business name is required.");
      ok = false;
    } else if (trimmed.length < 2) {
      setNameError("Business name must be at least 2 characters.");
      ok = false;
    } else if (trimmed.length > 100) {
      setNameError("Business name must be 100 characters or fewer.");
      ok = false;
    }

    return ok;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;

    setIsLoading(true);

    try {
      const business = await businessesApi.create({ name: name.trim() });
      setCreatedId(business.id);
      setCreatedName(business.name);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.error?.message;
        setFormError(message ?? "Unable to create business. Please try again.");
      } else {
        setFormError("Unable to create business. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = () => {
    if (!createdId) return;
    navigate(`/admin/${createdId}/dashboard`, { replace: true });
  };

  return (
    <div className="app-canvas min-h-screen px-6 py-12 sm:px-10 lg:py-16">
      <div className="mx-auto max-w-5xl">
        {createdId ? (
          <SuccessStep
            businessName={createdName}
            onContinue={handleContinue}
          />
        ) : (
          <>
            <div className="mb-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--color-ink-subtle)]">
                Onboarding
              </p>
              <h1 className="mt-1.5 text-3xl font-semibold tracking-tight text-[var(--color-ink)]">
                Create your business
              </h1>
              <p className="mt-2 max-w-xl text-sm text-[var(--color-ink-muted)]">
                {user ? `Welcome, ${user.firstName}. ` : ""}
                A business is the tenant that owns your services, plans,
                customers and billing data.
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
              <div className="rounded-3xl border border-[var(--color-border-soft)] bg-white p-6 shadow-[var(--shadow-card)] sm:p-8">
                <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                  {formError ? (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-700">
                      {formError}
                    </div>
                  ) : null}

                  <div className="space-y-1.5">
                    <label
                      htmlFor="businessName"
                      className="block text-xs font-semibold text-[var(--color-ink)]"
                    >
                      Business name
                    </label>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-ink-subtle)]">
                        <Building2 className="h-4 w-4" />
                      </span>
                      <input
                        id="businessName"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={isLoading}
                        placeholder="Acme Cloud"
                        autoComplete="organization"
                        autoFocus
                        className={`h-11 w-full rounded-xl border bg-[var(--color-surface)] pl-10 pr-3.5 text-sm text-[var(--color-ink)] outline-none transition placeholder:text-[var(--color-ink-subtle)] focus:ring-4 disabled:opacity-60 ${
                          nameError
                            ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
                            : "border-[var(--color-border-soft)] focus:border-[var(--color-ink)] focus:ring-[var(--color-accent)]/25"
                        }`}
                      />
                    </div>
                    {nameError ? (
                      <p className="text-xs text-rose-600">{nameError}</p>
                    ) : (
                      <p className="text-xs text-[var(--color-ink-muted)]">
                        You can rename this later from Settings.
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs text-[var(--color-ink-subtle)]">
                      You can change this later in settings.
                    </p>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[var(--color-accent)] px-6 text-sm font-semibold text-[var(--color-accent-foreground)] transition hover:brightness-105 disabled:opacity-60"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Creating…
                        </>
                      ) : (
                        "Create business"
                      )}
                    </button>
                  </div>
                </form>
              </div>

              <aside className="space-y-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--color-ink-subtle)]">
                  What happens next
                </p>
                <NextStep
                  icon={Sparkles}
                  title="Add services & plans"
                  description="Define what you sell and at what price."
                />
                <NextStep
                  icon={Receipt}
                  title="Share your catalog"
                  description="Customers can browse and subscribe to your plans."
                />
                <NextStep
                  icon={CreditCard}
                  title="Track everything"
                  description="Subscriptions, invoices and payments in one dashboard."
                />
              </aside>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function SuccessStep({
  businessName,
  onContinue,
}: {
  businessName: string;
  onContinue: () => void;
}) {
  return (
    <div className="mx-auto max-w-lg pt-10 text-center">
      <div className="a-check-pop mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 ring-1 ring-emerald-200">
        <svg
          viewBox="0 0 24 24"
          className="h-8 w-8"
          fill="none"
          stroke="#16a34a"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path className="a-check-draw" d="M4 12.5l5 5L20 6.5" />
        </svg>
      </div>

      <h1 className="mt-6 text-3xl font-semibold tracking-tight text-[var(--color-ink)]">
        Business created
      </h1>
      <p className="mt-2 text-sm text-[var(--color-ink-muted)]">
        {businessName} has been created successfully.
      </p>

      <div className="mt-8">
        <button
          type="button"
          onClick={onContinue}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[var(--color-accent)] px-6 text-sm font-semibold text-[var(--color-accent-foreground)] transition hover:brightness-105"
        >
          Continue to {businessName}
          <Check className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

interface NextStepProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

function NextStep({ icon: Icon, title, description }: NextStepProps) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-[var(--color-border-soft)] bg-white p-4 shadow-[var(--shadow-soft)]">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-accent-soft)] text-[var(--color-ink)]">
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <p className="text-sm font-semibold text-[var(--color-ink)]">{title}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-[var(--color-ink-muted)]">
          {description}
        </p>
      </div>
    </div>
  );
}