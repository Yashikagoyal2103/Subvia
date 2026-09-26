import { CreditCard, Info } from "lucide-react";
import { Link, useLocation, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { plansApi } from "@/api/plans";
import { servicesApi } from "@/api/services";
import { formatMoney } from "@/lib/format";
import { useCurrentBusinessName } from "@/hooks/useCurrentBusinessName";

import { AdminCard } from "@/components/admin/AdminCard";
import { AdminErrorState } from "@/components/admin/AdminErrorState";
import { AdminLoadingState } from "@/components/admin/AdminLoadingState";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { StatusBadge } from "@/components/status-badge";

export function AdminPlanDetailsPage() {
  const { businessId, planId } = useParams<{
    businessId: string;
    planId: string;
  }>();
  const location = useLocation();
  const businessName = useCurrentBusinessName();

  const serviceIdFromState = (location.state as { serviceId?: string } | null)
    ?.serviceId;

  const planQuery = useQuery({
    queryKey: ["plan", businessId, serviceIdFromState, planId],
    queryFn: () =>
      plansApi.getById(businessId!, serviceIdFromState!, planId!),
    enabled: Boolean(businessId && planId && serviceIdFromState),
  });

  const serviceQuery = useQuery({
    queryKey: ["service", businessId, serviceIdFromState],
    queryFn: () => servicesApi.getById(businessId!, serviceIdFromState!),
    enabled: Boolean(businessId && serviceIdFromState),
  });

  if (!businessId || !planId) {
    return <AdminErrorState message="A valid plan context is required." />;
  }

  if (!serviceIdFromState) {
    return (
      <div className="space-y-6">
        <Link
          to={`/admin/${businessId}/plans`}
          className="text-xs font-semibold text-[var(--a-ink-2)] hover:text-[var(--a-ink)]"
        >
          ← Back to plans
        </Link>

        <AdminCard className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--a-indigo-soft)] text-[var(--a-indigo)]">
            <Info className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-semibold text-[var(--a-ink)]">
              Missing plan context
            </p>
            <p className="mt-1 text-sm text-[var(--a-ink-2)]">
              This plan belongs to a specific service. Open it from the plans
              list so we know which service to load it from.
            </p>
            <Link
              to={`/admin/${businessId}/plans`}
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-[var(--a-ink)] px-4 py-2 text-xs font-semibold text-white transition hover:opacity-90"
            >
              Go to plans
            </Link>
          </div>
        </AdminCard>
      </div>
    );
  }

  if (planQuery.isLoading) return <AdminLoadingState variant="detail" />;
  if (planQuery.isError || !planQuery.data) {
    return (
      <AdminErrorState
        message="We couldn't load this plan."
        onRetry={() => planQuery.refetch()}
      />
    );
  }

  const plan = planQuery.data;
  const service = serviceQuery.data;

  return (
    <div className="space-y-6">
      <Link
        to={`/admin/${businessId}/plans`}
        state={{ serviceId: serviceIdFromState }}
        className="text-xs font-semibold text-[var(--a-ink-2)] hover:text-[var(--a-ink)]"
      >
        ← Back to plans
      </Link>

      <AdminPageHeader
        eyebrow={
          businessName
            ? `${businessName} / ${service?.name ?? "Plans"} / ${plan.name}`
            : `Plans / ${plan.name}`
        }
        title={plan.name}
        description={plan.description ?? "No description provided."}
        actions={
          <StatusBadge status={plan.isActive ? "ACTIVE" : "INACTIVE"} />
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
        <AdminCard>
          <div className="flex items-center gap-3 border-b border-[var(--a-border)] pb-4">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--a-violet-soft)] text-[var(--a-violet)]">
              <CreditCard className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--a-ink-3)]">
                Plan
              </p>
              <p className="mt-0.5 text-sm font-semibold text-[var(--a-ink)]">
                {plan.name}
              </p>
            </div>
          </div>

          <dl className="grid gap-5 pt-5 sm:grid-cols-2">
            <Field label="Service" value={service?.name ?? "—"} />
            <Field
              label="Price"
              value={`${formatMoney(plan.price, plan.currency)} / ${
                plan.interval === "MONTHLY" ? "month" : "year"
              }`}
            />
            <Field label="Currency" value={plan.currency} />
            <Field
              label="Billing interval"
              value={plan.interval === "MONTHLY" ? "Monthly" : "Yearly"}
            />
            <Field
              label="Status"
              value={plan.isActive ? "Active" : "Inactive"}
            />
            <Field
              label="Created"
              value={new Date(plan.createdAt).toLocaleDateString("en-IN")}
            />
          </dl>
        </AdminCard>

        <AdminCard>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--a-ink-3)]">
            Pricing
          </p>
          <p className="mt-2 text-3xl font-semibold tabular-nums tracking-tight text-[var(--a-ink)]">
            {formatMoney(plan.price, plan.currency)}
          </p>
          <p className="mt-1 text-sm text-[var(--a-ink-2)]">
            billed {plan.interval === "MONTHLY" ? "monthly" : "yearly"}
          </p>

          <div className="mt-6 border-t border-[var(--a-border)] pt-4">
            <p className="text-xs text-[var(--a-ink-2)]">
              To edit this plan&apos;s pricing or interval, open the plans list
              and click Edit on this plan.
            </p>
            <Link
              to={`/admin/${businessId}/plans`}
              state={{ serviceId: serviceIdFromState }}
              className="mt-4 inline-flex items-center gap-2 rounded-full border border-[var(--a-border)] bg-white px-4 py-2 text-xs font-semibold text-[var(--a-ink)] transition hover:border-[var(--a-border-strong)]"
            >
              Manage plans
            </Link>
          </div>
        </AdminCard>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--a-ink-3)]">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-[var(--a-ink)]">{value}</dd>
    </div>
  );
}