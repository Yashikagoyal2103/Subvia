
import { useState } from "react";
import { CreditCard } from "lucide-react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { adminApi, type AdminSubscription } from "../../api/admin";
import { formatMoney } from "@/lib/format";
import { useCurrentBusinessName } from "@/hooks/useCurrentBusinessName";

import { AdminCard } from "@/components/admin/AdminCard";
import { AdminErrorState } from "@/components/admin/AdminErrorState";
import { AdminLoadingState } from "@/components/admin/AdminLoadingState";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ListRow } from "@/components/admin/ListRow";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { StatusBadge } from "@/components/status-badge";
import type { AdminTone } from "@/components/admin/IconBadge";

function date(value: string) {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function toneFor(status: AdminSubscription["status"]): AdminTone {
  if (status === "ACTIVE") return "emerald";
  if (status === "PENDING") return "amber";
  if (status === "PAST_DUE") return "rose";
  return "violet";
}

export function AdminSubscriptionsPage() {
  const { businessId } = useParams<{ businessId: string }>();
  const businessName = useCurrentBusinessName();
  const [page, setPage] = useState(1);

  const query = useQuery({
    queryKey: ["admin-subscriptions", businessId, page],
    queryFn: () => adminApi.subscriptions(businessId!, page),
    enabled: Boolean(businessId),
  });

  if (!businessId) {
    return <AdminErrorState message="A valid business context is required." />;
  }
  if (query.isLoading) return <AdminLoadingState variant="list" rows={6} />;
  if (query.isError) {
    return (
      <AdminErrorState
        message="We couldn't load the subscriptions."
        onRetry={() => query.refetch()}
      />
    );
  }

  const subscriptions = query.data?.data ?? [];
  const pagination = query.data?.pagination;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow={
          businessName
            ? `${businessName} / Subscriptions`
            : "Admin / Subscriptions"
        }
        title="Subscriptions"
        description="Monitor every customer subscription in this business."
      />

      <AdminCard variant="flush">
        <div className="border-b border-[var(--a-border)] px-6 py-5">
          <h2 className="text-sm font-semibold text-[var(--a-ink)]">
            Subscription portfolio
          </h2>
          <p className="mt-0.5 text-xs text-[var(--a-ink-3)]">
            {pagination?.total ?? subscriptions.length} subscription
            {(pagination?.total ?? subscriptions.length) === 1 ? "" : "s"} in this business
          </p>
        </div>

        {subscriptions.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <CreditCard className="mx-auto h-8 w-8 text-[var(--a-ink-3)]" />
            <p className="mt-3 text-sm font-semibold text-[var(--a-ink)]">
              No subscriptions yet
            </p>
            <p className="mt-1 text-sm text-[var(--a-ink-2)]">
              Customer subscriptions will appear here.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-[var(--a-border)] px-4 py-2">
            {subscriptions.map((sub) => (
              <li key={sub.id}>
                <ListRow
                  icon={<CreditCard className="h-4 w-4" />}
                  leadingBadgeTone={toneFor(sub.status)}
                  title={sub.plan.name}
                  subtitle={`${sub.plan.service.name} · ${sub.customerProfile.user.email}`}
                  trailing={
                    <>
                      {sub.cancelAtPeriodEnd ? (
                        <span className="hidden rounded-full bg-[var(--a-amber-soft)] px-2.5 py-1 text-[11px] font-semibold text-[#7c540f] sm:inline-flex">
                          Cancels at period end
                        </span>
                      ) : null}
                      <span className="text-sm font-semibold tabular-nums text-[var(--a-ink)]">
                        {formatMoney(sub.price, sub.currency)}
                      </span>
                      <StatusBadge status={sub.status} />
                    </>
                  }
                  href={`/admin/${businessId}/subscriptions/${sub.id}`}
                />
                <p className="px-2 pb-3 text-[11px] text-[var(--a-ink-3)]">
                  Next period ends {date(sub.billingPeriodEnd)} ·{" "}
                  {sub._count.invoices} invoice
                  {sub._count.invoices === 1 ? "" : "s"}
                </p>
              </li>
            ))}
          </ul>
        )}

        {pagination ? (
          <AdminPagination
            page={page}
            limit={pagination.limit}
            total={pagination.total}
            hasNextPage={pagination.hasNextPage}
            onPageChange={setPage}
          />
        ) : null}
      </AdminCard>
    </div>
  );
}
