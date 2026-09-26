import { CreditCard, Layers, Plus } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { plansApi } from "@/api/plans";
import { servicesApi } from "@/api/services";
import { formatMoney } from "@/lib/format";
import { useCurrentBusinessName } from "@/hooks/useCurrentBusinessName";

import { AdminCard } from "@/components/admin/AdminCard";
import { AdminErrorState } from "@/components/admin/AdminErrorState";
import { AdminLoadingState } from "@/components/admin/AdminLoadingState";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ListRow } from "@/components/admin/ListRow";
import { StatusBadge } from "@/components/status-badge";

export function AdminServiceDetailsPage() {
  const { businessId, serviceId } = useParams<{
    businessId: string;
    serviceId: string;
  }>();
  const navigate = useNavigate();
  const businessName = useCurrentBusinessName();

  const serviceQuery = useQuery({
    queryKey: ["service", businessId, serviceId],
    queryFn: () => servicesApi.getById(businessId!, serviceId!),
    enabled: Boolean(businessId && serviceId),
  });

  const plansQuery = useQuery({
    queryKey: ["plans", businessId, serviceId],
    queryFn: () => plansApi.list(businessId!, serviceId!),
    enabled: Boolean(businessId && serviceId),
  });

  if (!businessId || !serviceId) {
    return <AdminErrorState message="A valid service context is required." />;
  }
  if (serviceQuery.isLoading) return <AdminLoadingState variant="detail" />;
  if (serviceQuery.isError || !serviceQuery.data) {
    return (
      <AdminErrorState
        message="We couldn't find this service."
        onRetry={() => serviceQuery.refetch()}
      />
    );
  }

  const service = serviceQuery.data;
  const plans = plansQuery.data ?? [];

  return (
    <div className="space-y-6">
      <Link
        to={`/admin/${businessId}/services`}
        className="text-xs font-semibold text-[var(--a-ink-2)] transition hover:text-[var(--a-ink)]"
      >
        ← Back to services
      </Link>

      <AdminPageHeader
        eyebrow={
          businessName
            ? `${businessName} / Services / ${service.name}`
            : `Services / ${service.name}`
        }
        title={service.name}
        description={service.description ?? "No description provided."}
        actions={
          <StatusBadge status={service.isActive ? "ACTIVE" : "INACTIVE"} />
        }
      />

      <AdminCard>
        <div className="flex items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--a-indigo-soft)] text-[var(--a-indigo)]">
            <Layers className="h-5 w-5" />
          </span>
          <dl className="grid flex-1 gap-5 sm:grid-cols-3">
            <Field label="Service ID" value={service.id} mono />
            <Field
              label="Created"
              value={new Date(service.createdAt).toLocaleDateString("en-IN")}
            />
            <Field
              label="Status"
              value={service.isActive ? "Active" : "Inactive"}
            />
          </dl>
        </div>
      </AdminCard>

      <AdminCard variant="flush">
        <div className="flex items-center justify-between border-b border-[var(--a-border)] px-6 py-5">
          <div>
            <h2 className="text-sm font-semibold text-[var(--a-ink)]">Plans</h2>
            <p className="mt-0.5 text-xs text-[var(--a-ink-3)]">
              Pricing plans available for this service.
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              navigate(`/admin/${businessId}/plans`, {
                state: { serviceId },
              })
            }
            className="inline-flex items-center gap-2 rounded-full bg-[var(--a-ink)] px-4 py-2 text-xs font-semibold text-white transition hover:opacity-90"
          >
            <Plus className="h-3.5 w-3.5" />
            Create plan
          </button>
        </div>

        {plansQuery.isLoading ? (
          <div className="px-6 py-8">
            <AdminLoadingState variant="list" rows={3} />
          </div>
        ) : plansQuery.isError ? (
          <div className="px-6 py-8">
            <AdminErrorState
              message="Unable to load plans."
              onRetry={() => plansQuery.refetch()}
            />
          </div>
        ) : plans.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <CreditCard className="mx-auto h-8 w-8 text-[var(--a-ink-3)]" />
            <p className="mt-3 text-sm font-medium text-[var(--a-ink)]">
              No plans yet
            </p>
            <p className="mt-1 text-sm text-[var(--a-ink-2)]">
              Add the first pricing plan for this service.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-[var(--a-border)] px-4 py-2">
            {plans.map((plan) => (
              <li key={plan.id}>
                <ListRow
                  icon={<CreditCard className="h-4 w-4" />}
                  leadingBadgeTone="violet"
                  title={plan.name}
                  subtitle={`${plan.interval === "MONTHLY" ? "Monthly" : "Yearly"} · ${plan.currency}`}
                  trailing={
                    <>
                      <span className="text-sm font-semibold tabular-nums text-[var(--a-ink)]">
                        {formatMoney(plan.price, plan.currency)}
                      </span>
                      <StatusBadge
                        status={plan.isActive ? "ACTIVE" : "INACTIVE"}
                      />
                    </>
                  }
                  href={`/admin/${businessId}/plans/${plan.id}`}
                />
              </li>
            ))}
          </ul>
        )}
      </AdminCard>
    </div>
  );
}

function Field({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--a-ink-3)]">
        {label}
      </dt>
      <dd
        className={
          mono
            ? "mt-1 truncate font-mono text-xs text-[var(--a-ink-2)]"
            : "mt-1 text-sm text-[var(--a-ink)]"
        }
      >
        {value}
      </dd>
    </div>
  );
}