
import { useState } from "react";
import { CreditCard, Edit3, Loader2, Plus, X } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, useLocation, useParams } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";

import {
  plansApi,
  type BillingInterval,
  type Currency,
  type Plan,
} from "../../api/plans";
import { servicesApi } from "../../api/services";
import { Button } from "../../components/ui/button";
import { StatusBadge } from "../../components/status-badge";
import { queryClient } from "../../lib/query-client";
import { formatMoney } from "@/lib/format";
import { useCurrentBusinessName } from "@/hooks/useCurrentBusinessName";

import { AdminCard } from "@/components/admin/AdminCard";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { AdminErrorState } from "@/components/admin/AdminErrorState";
import { AdminLoadingState } from "@/components/admin/AdminLoadingState";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { IconBadge } from "@/components/admin/IconBadge";

export function AdminPlansPage() {
  const { businessId } = useParams<{ businessId: string }>();
  const location = useLocation();
  const businessName = useCurrentBusinessName();

  // Read state passed from ServiceDetailsPage or PlanDetailsPage
  const preselected = (location.state as { serviceId?: string } | null)
    ?.serviceId;

  const [serviceId, setServiceId] = useState(preselected ?? "");
  const [editing, setEditing] = useState<Plan | null>(null);
  const [creating, setCreating] = useState(false);

  const servicesQuery = useQuery({
    queryKey: ["services", businessId],
    queryFn: () => servicesApi.list(businessId!),
    enabled: Boolean(businessId),
  });

  const services = servicesQuery.data ?? [];
  const selectedServiceId = serviceId || services[0]?.id || "";

  const plansQuery = useQuery({
    queryKey: ["plans", businessId, selectedServiceId],
    queryFn: () => plansApi.list(businessId!, selectedServiceId),
    enabled: Boolean(businessId && selectedServiceId),
  });

  const mutation = useMutation({
    mutationFn: async (input: {
      id?: string;
      name: string;
      description?: string;
      price: number;
      currency: Currency;
      interval: BillingInterval;
    }) => {
      if (input.id) {
        return plansApi.update(businessId!, selectedServiceId, input.id, input);
      }
      return plansApi.create(businessId!, selectedServiceId, input);
    },
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ["plans", businessId, selectedServiceId],
      });
      setEditing(null);
      setCreating(false);
      toast.success(variables.id ? "Plan updated." : "Plan created.");
    },
    onError: (error) => {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.error?.message
        : undefined;
      toast.error(message ?? "Unable to save plan.");
    },
  });

  if (!businessId) {
    return <AdminErrorState message="A valid business context is required." />;
  }
  if (servicesQuery.isLoading) return <AdminLoadingState variant="list" rows={4} />;
  if (servicesQuery.isError) {
    return (
      <AdminErrorState
        message="Unable to load services."
        onRetry={() => servicesQuery.refetch()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow={businessName ? `${businessName} / Plans` : "Admin / Plans"}
        title="Plans"
        description="Configure pricing and billing intervals for each service."
        actions={
          <Button
            disabled={!selectedServiceId}
            onClick={() => setCreating(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create plan
          </Button>
        }
      />

      {services.length === 0 ? (
        <AdminEmptyState
          icon={CreditCard}
          title="Create a service first"
          description="Plans belong to a service. Add a service before creating plans."
        />
      ) : (
        <>
          <AdminCard>
            <label className="block text-sm font-medium text-[var(--a-ink)]">
              Service
            </label>
            <select
              value={selectedServiceId}
              onChange={(e) => setServiceId(e.target.value)}
              className="mt-2 w-full max-w-md rounded-xl border border-[var(--a-border)] bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[var(--a-indigo)]"
            >
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
          </AdminCard>

          {plansQuery.isLoading ? (
            <AdminLoadingState variant="cards" rows={3} />
          ) : plansQuery.isError ? (
            <AdminErrorState
              message="Unable to load plans."
              onRetry={() => plansQuery.refetch()}
            />
          ) : plansQuery.data && plansQuery.data.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {plansQuery.data.map((plan) => (
                <AdminCard key={plan.id} interactive className="flex min-w-0 flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <IconBadge
                      icon={<CreditCard className="h-4 w-4" />}
                      tone="violet"
                      size="md"
                    />
                    <StatusBadge
                      status={plan.isActive ? "ACTIVE" : "INACTIVE"}
                    />
                  </div>

                  <Link
                    to={`/admin/${businessId}/services/${selectedServiceId}/plans/${plan.id}`}
                    className="mt-5 block"
                  >
                    <h2 className="break-words text-base font-semibold text-[var(--a-ink)] transition hover:text-[var(--a-indigo)]">
                      {plan.name}
                    </h2>
                    <p className="mt-1.5 min-h-10 break-words text-sm text-[var(--a-ink-2)] line-clamp-3">
                      {plan.description || "No description provided."}
                    </p>

                    <div className="mt-4 flex items-baseline gap-1">
                      <span className="text-2xl font-semibold tabular-nums text-[var(--a-ink)]">
                        {formatMoney(plan.price, plan.currency)}
                      </span>
                      <span className="text-xs text-[var(--a-ink-3)]">
                        /{plan.interval === "MONTHLY" ? "mo" : "yr"}
                      </span>
                    </div>
                  </Link>

                  <div className="mt-5 flex items-center justify-between border-t border-[var(--a-border)] pt-4">
                    <span className="text-xs text-[var(--a-ink-3)]">
                      {plan.currency} · {plan.interval === "MONTHLY" ? "Monthly" : "Yearly"}
                    </span>
                    <button
                      type="button"
                      onClick={() => setEditing(plan)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--a-indigo)] hover:underline"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      Edit
                    </button>
                  </div>
                </AdminCard>
              ))}
            </div>
          ) : (
            <AdminEmptyState
              icon={CreditCard}
              title="No plans yet"
              description="Create the first pricing plan for this service."
              action={
                <Button onClick={() => setCreating(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create plan
                </Button>
              }
            />
          )}
        </>
      )}

      {(creating || editing) && (
        <PlanModal
          plan={editing}
          loading={mutation.isPending}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSubmit={(data) => mutation.mutate({ ...data, id: editing?.id })}
        />
      )}
    </div>
  );
}

/* ────────── Plan modal — T0 MONEY BUG FIX APPLIED ────────── */

function PlanModal({
  plan,
  loading,
  onClose,
  onSubmit,
}: {
  plan: Plan | null;
  loading: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    description?: string;
    price: number;
    currency: Currency;
    interval: BillingInterval;
  }) => void;
}) {
  const [name, setName] = useState(plan?.name ?? "");
  const [description, setDescription] = useState(plan?.description ?? "");
  // Pre-fill the input as a plain decimal (e.g. "699.00"), not paise.
  const [price, setPrice] = useState(plan ? String(plan.price / 100) : "");
  const [currency, setCurrency] = useState<Currency>(plan?.currency ?? "INR");
  const [interval, setInterval] = useState<BillingInterval>(
    plan?.interval ?? "MONTHLY",
  );

  const submit = (event: React.FormEvent) => {
    event.preventDefault();

    const amountMajor = Number(price);

    if (
      !name.trim() ||
      !Number.isFinite(amountMajor) ||
      amountMajor <= 0
    ) {
      return;
    }

    // ─── T0 FIX ───
    // The user typed a major-unit number (e.g. 699). The backend stores
    // minor units. Multiply by 100 and round to avoid float drift.
    const amountMinor = Math.round(amountMajor * 100);

    onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      price: amountMinor,
      currency,
      interval,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(15,15,10,0.4)] p-4 backdrop-blur-sm">
      <form
        onSubmit={submit}
        className="w-full max-w-lg rounded-2xl border border-[var(--a-border)] bg-white p-6 shadow-[0_20px_50px_-20px_rgba(15,15,10,0.28)]"
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--a-indigo)]">
              Pricing
            </p>
            <h2 className="mt-1 text-xl font-semibold text-[var(--a-ink)]">
              {plan ? "Edit plan" : "Create plan"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-[var(--a-ink-3)] hover:bg-[rgba(15,15,10,0.04)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6 space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-[var(--a-ink)]">Name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              minLength={2}
              maxLength={100}
              required
              className="mt-2 w-full rounded-xl border border-[var(--a-border)] px-3 py-2.5 text-sm outline-none transition focus:border-[var(--a-indigo)]"
              placeholder="Pro"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-[var(--a-ink)]">
              Description
            </span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={3}
              className="mt-2 w-full resize-none rounded-xl border border-[var(--a-border)] px-3 py-2.5 text-sm outline-none transition focus:border-[var(--a-indigo)]"
              placeholder="Plan description..."
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-3">
            <label className="block sm:col-span-1">
              <span className="text-sm font-medium text-[var(--a-ink)]">
                Price
              </span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                className="mt-2 w-full rounded-xl border border-[var(--a-border)] px-3 py-2.5 text-sm outline-none transition focus:border-[var(--a-indigo)]"
                placeholder="699.00"
              />
              <span className="mt-1 block text-[11px] text-[var(--a-ink-3)]">
                Entered as {currency === "INR" ? "rupees" : "dollars"}
              </span>
            </label>
            <label className="block">
              <span className="text-sm font-medium text-[var(--a-ink)]">
                Currency
              </span>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as Currency)}
                className="mt-2 w-full rounded-xl border border-[var(--a-border)] bg-white px-3 py-2.5 text-sm"
              >
                <option value="INR">INR</option>
                <option value="USD">USD</option>
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-medium text-[var(--a-ink)]">
                Interval
              </span>
              <select
                value={interval}
                onChange={(e) =>
                  setInterval(e.target.value as BillingInterval)
                }
                className="mt-2 w-full rounded-xl border border-[var(--a-border)] bg-white px-3 py-2.5 text-sm"
              >
                <option value="MONTHLY">Monthly</option>
                <option value="YEARLY">Yearly</option>
              </select>
            </label>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>

          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {plan ? "Save changes" : "Create plan"}
          </Button>
        </div>
      </form>
    </div>
  );
}
