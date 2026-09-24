import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import axios from "axios";
import {
  Building2,
  ChevronRight,
  LayoutDashboard,
  Loader2,
  Plus,
  ShieldCheck,
  Store,
  UserCircle2,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { businessesApi, type MyBusiness } from "../../api/businesses";
import { useAuthStore } from "../../stores/auth.store";
import { LogoutButton } from "../../components/auth/LogoutButton";
import { LoadingState } from "../../components/loading-state";

export function WorkspacePage() {
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.accountType === "ADMIN";

  const query = useQuery({
    queryKey: ["my-businesses"],
    queryFn: businessesApi.getMine,
    // Only admins have business memberships — skip the call for customers
    // so they don't trigger a 403 in the console.
    enabled: isAdmin,
    retry: false,
  });

  return (
    <div className="app-canvas min-h-screen">
      {/* Top bar */}
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6 sm:px-10">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-ink)] text-[13px] font-bold text-[var(--color-accent)]">
            B
          </span>
          <span className="text-sm font-semibold tracking-tight text-[var(--color-ink)]">
            BillingOS
          </span>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <div className="hidden items-center gap-2 rounded-full border border-[var(--color-border-soft)] bg-white px-3 py-1.5 sm:flex">
              <UserCircle2 className="h-3.5 w-3.5 text-[var(--color-ink-muted)]" />
              <span className="text-xs font-medium text-[var(--color-ink)]">
                {user.firstName} {user.lastName}
              </span>
              <span className="rounded-full bg-[var(--color-surface)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-ink-muted)]">
                {user.accountType}
              </span>
            </div>
          ) : null}
          <LogoutButton />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 pb-16 pt-4 sm:px-10">
        {isAdmin ? (
          <AdminWorkspace
            query={query}
            businessCount={query.data?.length ?? 0}
          />
        ) : (
          <CustomerWorkspace
            firstName={user?.firstName ?? "there"}
          />
        )}
      </main>
    </div>
  );
}

/* ───────────────────────── Admin view ───────────────────────── */

interface AdminWorkspaceProps {
  query: ReturnType<typeof useQuery<MyBusiness[]>>;
  businessCount: number;
}

function AdminWorkspace({ query, businessCount }: AdminWorkspaceProps) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState("");

  const createMutation = useMutation({
    mutationFn: (businessName: string) =>
      businessesApi.create({ name: businessName }),
    onSuccess: (business) => {
      toast.success("Business created.");
      qc.invalidateQueries({ queryKey: ["my-businesses"] });
      navigate(`/admin/${business.id}/dashboard`);
    },
    onError: (error: unknown) => {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.error?.message;
        toast.error(message ?? "Unable to create business.");
      } else {
        toast.error("Unable to create business.");
      }
    },
  });

  const handleCreate = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();

    if (!trimmed) {
      setNameError("Business name is required.");
      return;
    }
    if (trimmed.length < 2) {
      setNameError("Business name must be at least 2 characters.");
      return;
    }
    setNameError("");
    createMutation.mutate(trimmed);
  };

  return (
    <div className="space-y-8">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--color-ink-subtle)]">
          Workspace
        </p>
        <h1 className="mt-1.5 text-3xl font-semibold tracking-tight text-[var(--color-ink)]">
          Choose your business
        </h1>
        <p className="mt-2 text-sm text-[var(--color-ink-muted)]">
          Select a business to open its billing workspace.
        </p>
      </div>

      {query.isLoading ? <LoadingState /> : null}

      {query.isError ? (
        <div className="rounded-2xl border border-rose-100 bg-white/80 px-6 py-10 text-center">
          <p className="text-sm font-semibold text-[var(--color-ink)]">
            Unable to load your workspace
          </p>
          <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
            Please refresh and try again.
          </p>
        </div>
      ) : null}

      {!query.isLoading && !query.isError && businessCount === 0 && !creating ? (
        <EmptyAdminState onCreate={() => setCreating(true)} />
      ) : null}

      {!query.isLoading && !query.isError && businessCount > 0 ? (
        <div className="space-y-4">
          {query.data!.map((business) => (
            <BusinessCard key={business.id} business={business} />
          ))}

          {creating ? (
            <CreateForm
              name={name}
              setName={setName}
              nameError={nameError}
              isLoading={createMutation.isPending}
              onCancel={() => {
                setCreating(false);
                setName("");
                setNameError("");
              }}
              onSubmit={handleCreate}
            />
          ) : (
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border-soft)] bg-white px-4 py-2 text-sm font-semibold text-[var(--color-ink)] transition hover:border-[var(--color-border-strong)]"
            >
              <Plus className="h-3.5 w-3.5" />
              Add another business
            </button>
          )}
        </div>
      ) : null}

      {creating && businessCount === 0 ? (
        <CreateForm
          name={name}
          setName={setName}
          nameError={nameError}
          isLoading={createMutation.isPending}
          onCancel={() => {
            setCreating(false);
            setName("");
            setNameError("");
          }}
          onSubmit={handleCreate}
        />
      ) : null}
    </div>
  );
}

function EmptyAdminState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="rounded-3xl border border-dashed border-[var(--color-border-soft)] bg-white/60 px-8 py-14 text-center">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-accent-soft)] text-[var(--color-ink)]">
        <Building2 className="h-5 w-5" />
      </span>
      <h2 className="mt-4 text-lg font-semibold tracking-tight text-[var(--color-ink)]">
        Create your first business
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-[var(--color-ink-muted)]">
        Your business is the tenant that owns services, plans, customers and
        billing data.
      </p>
      <button
        type="button"
        onClick={onCreate}
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-[var(--color-accent)] px-5 py-2.5 text-sm font-semibold text-[var(--color-accent-foreground)] transition hover:brightness-105"
      >
        <Plus className="h-4 w-4" />
        Create business
      </button>
    </div>
  );
}

function BusinessCard({ business }: { business: MyBusiness }) {
  return (
    <div className="rounded-3xl border border-[var(--color-border-soft)] bg-white p-6 shadow-[var(--shadow-card)]">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--color-accent-soft)] text-[var(--color-ink)]">
            <Building2 className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-base font-semibold tracking-tight text-[var(--color-ink)]">
              {business.name}
            </h3>
            <p className="mt-0.5 text-xs text-[var(--color-ink-muted)]">
              Tax rate: {business.taxRate}%
            </p>
          </div>
        </div>
        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
          Admin
        </span>
      </div>

      <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
        <WorkspaceButton
          to={`/admin/${business.id}/dashboard`}
          icon={LayoutDashboard}
          title="Admin workspace"
          description="Services, plans, customers, invoices"
        />
        <WorkspaceButton
          to={`/customer/${business.id}/dashboard`}
          icon={Store}
          title="Customer view"
          description="Preview the customer experience"
        />
      </div>
    </div>
  );
}

interface WorkspaceButtonProps {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

function WorkspaceButton({
  to,
  icon: Icon,
  title,
  description,
}: WorkspaceButtonProps) {
  return (
    <a
      href={to}
      className="group flex items-center justify-between gap-3 rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface)] px-4 py-3 transition hover:border-[var(--color-border-strong)] hover:bg-white"
    >
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-[var(--color-ink)] ring-1 ring-[var(--color-border-soft)]">
          <Icon className="h-4 w-4" />
        </span>
        <div className="text-left">
          <p className="text-sm font-semibold text-[var(--color-ink)]">
            {title}
          </p>
          <p className="text-[11px] text-[var(--color-ink-muted)]">
            {description}
          </p>
        </div>
      </div>
      <ChevronRight className="h-4 w-4 text-[var(--color-ink-subtle)] transition group-hover:text-[var(--color-ink)]" />
    </a>
  );
}

interface CreateFormProps {
  name: string;
  setName: (v: string) => void;
  nameError: string;
  isLoading: boolean;
  onCancel: () => void;
  onSubmit: (event: React.FormEvent) => void;
}

function CreateForm({
  name,
  setName,
  nameError,
  isLoading,
  onCancel,
  onSubmit,
}: CreateFormProps) {
  return (
    <form
      onSubmit={onSubmit}
      className="rounded-3xl border border-[var(--color-border-soft)] bg-white p-6 shadow-[var(--shadow-card)]"
      noValidate
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold tracking-tight text-[var(--color-ink)]">
          New business
        </h3>
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--color-ink-muted)] transition hover:bg-[var(--color-surface)] hover:text-[var(--color-ink)] disabled:opacity-50"
          aria-label="Cancel"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="mt-4 space-y-1.5">
        <label
          htmlFor="businessName"
          className="block text-xs font-semibold text-[var(--color-ink)]"
        >
          Business name
        </label>
        <input
          id="businessName"
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          disabled={isLoading}
          placeholder="Acme Cloud"
          autoComplete="organization"
          autoFocus
          className={`h-11 w-full rounded-xl border bg-[var(--color-surface)] px-3.5 text-sm text-[var(--color-ink)] outline-none transition placeholder:text-[var(--color-ink-subtle)] focus:ring-4 disabled:opacity-60 ${
            nameError
              ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
              : "border-[var(--color-border-soft)] focus:border-[var(--color-ink)] focus:ring-[var(--color-accent)]/25"
          }`}
        />
        {nameError ? (
          <p className="text-xs text-rose-600">{nameError}</p>
        ) : null}
      </div>

      <div className="mt-5 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="inline-flex items-center rounded-full border border-[var(--color-border-soft)] bg-white px-4 py-2 text-sm font-semibold text-[var(--color-ink)] transition hover:border-[var(--color-border-strong)] disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center gap-2 rounded-full bg-[var(--color-accent)] px-5 py-2 text-sm font-semibold text-[var(--color-accent-foreground)] transition hover:brightness-105 disabled:opacity-60"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Creating…
            </>
          ) : (
            "Create"
          )}
        </button>
      </div>
    </form>
  );
}

/* ───────────────────────── Customer view ───────────────────────── */

function CustomerWorkspace({ firstName }: { firstName: string }) {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--color-ink-subtle)]">
          Workspace
        </p>
        <h1 className="mt-1.5 text-3xl font-semibold tracking-tight text-[var(--color-ink)]">
          Hi {firstName}.
        </h1>
        <p className="mt-2 max-w-xl text-sm text-[var(--color-ink-muted)]">
          You&apos;re signed in as a customer.
        </p>
      </div>

      <div className="rounded-3xl border border-[var(--color-border-soft)] bg-white p-8 shadow-[var(--shadow-card)]">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-accent-soft)] text-[var(--color-ink)]">
            <Store className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-base font-semibold tracking-tight text-[var(--color-ink)]">
              You don&apos;t have any customer workspaces yet
            </h2>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-[var(--color-ink-muted)]">
              A customer workspace appears here when you subscribe to a service
              from a business on BillingOS. Once you subscribe, you&apos;ll be
              able to manage your subscriptions, invoices and credits from that
              workspace.
            </p>
          </div>
        </div>

        <div className="mt-6 border-t border-[var(--color-border-soft)] pt-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">
            Running a business instead?
          </p>
          <p className="mt-1.5 text-sm text-[var(--color-ink-muted)]">
            You can create a business workspace any time — it&apos;s separate
            from your customer account.
          </p>
          <a
            href="/onboarding/create-business"
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-[var(--color-accent)] px-5 py-2.5 text-sm font-semibold text-[var(--color-accent-foreground)] transition hover:brightness-105"
          >
            <Plus className="h-4 w-4" />
            Create a business
          </a>
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-2xl border border-[var(--color-border-soft)] bg-white/60 p-4">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-surface)] text-[var(--color-ink-muted)]">
          <ShieldCheck className="h-4 w-4" />
        </span>
        <p className="text-xs leading-relaxed text-[var(--color-ink-muted)]">
          Your customer account is separate from any business you administer.
          Business data stays isolated per tenant.
        </p>
      </div>
    </div>
  );
}