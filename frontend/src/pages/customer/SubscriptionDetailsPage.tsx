

import type { ReactNode } from "react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowDownCircle,
  ArrowLeft,
  ArrowUpCircle,
  Ban,
  CalendarClock,
  CheckCircle2,
  FileText,
  RefreshCw,
  Sparkles,
  XCircle,
} from "lucide-react";

import {
  subscriptionsApi,
  type Subscription,
  type SubscriptionEvent,
} from "@/api/subscriptions";
import { invoicesApi } from "@/api/invoices";
import { catalogApi } from "@/api/catalog";
import { formatMoney } from "@/lib/format";
import { formatDate, formatDateTime } from "@/lib/customer-utils";

import { CustomerConfirmDialog } from "@/components/customer/CustomerConfirmDialog";
import { CustomerErrorState } from "@/components/customer/CustomerErrorState";
import { CustomerLoadingState } from "@/components/customer/CustomerLoadingState";
import { GlassPanel } from "@/components/customer/GlassPanel";
import { MoneyText } from "@/components/customer/MoneyText";
import { PanelHeader } from "@/components/customer/PanelHeader";
import { ServiceAvatar } from "@/components/customer/ServiceAvatar";
import { StatusPill } from "@/components/customer/StatusPill";

type CancelMode = "PERIOD_END" | "IMMEDIATE";

/** Local fallback if getApiErrorMessage isn't exported by your api-shape.ts. */
function readApiError(err: unknown): string {
  if (err && typeof err === "object") {
    const resp = (err as { response?: { data?: { error?: { message?: string } } } })
      .response;
    const msg = resp?.data?.error?.message;
    if (typeof msg === "string" && msg.length > 0) return msg;
    if (err instanceof Error && err.message) return err.message;
  }
  return "Something went wrong. Please try again.";
}

export function SubscriptionDetailsPage() {
  const { subscriptionId = "" } = useParams();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cancelMode, setCancelMode] = useState<CancelMode>("PERIOD_END");

  const subQuery = useQuery({
    queryKey: ["customer-subscription", subscriptionId],
    queryFn: () => subscriptionsApi.getById(subscriptionId),
    enabled: Boolean(subscriptionId),
  });

  const eventsQuery = useQuery({
    queryKey: ["customer-subscription-events", subscriptionId],
    queryFn: () => subscriptionsApi.events(subscriptionId),
    enabled: Boolean(subscriptionId),
  });

  const invoicesQuery = useQuery({
    queryKey: ["customer-invoices", "all"],
    queryFn: () => invoicesApi.list(1, 100),
  });

  const catalogQuery = useQuery({
    queryKey: [
      "customer-subscription-plan-options",
      subQuery.data?.plan?.service?.id,
      subQuery.data?.plan?.service?.businessId,
    ],
    queryFn: () =>
      catalogApi.list({
        businessId: subQuery.data!.plan!.service!.businessId,
      }),
    enabled: Boolean(
      subQuery.data?.plan?.service?.id &&
      subQuery.data?.plan?.service?.businessId,
    ),
  });

  const upgradeMutation = useMutation({
    mutationFn: (planId: string) =>
      subscriptionsApi.upgrade(subscriptionId, planId),
    onSuccess: (result) => {
      toast.success("Upgrade created. Review the invoice to complete payment.");
      qc.invalidateQueries({ queryKey: ["customer-subscription", subscriptionId] });
      qc.invalidateQueries({ queryKey: ["customer-subscriptions"] });
      qc.invalidateQueries({ queryKey: ["customer-invoices"] });
      navigate(`/customer/invoices/${result.invoice.id}`);
    },
    onError: (err) => toast.error(readApiError(err)),
  });

  const downgradeMutation = useMutation({
    mutationFn: (planId: string) =>
      subscriptionsApi.downgrade(subscriptionId, planId),
    onSuccess: () => {
      toast.success("Downgrade scheduled for the next billing boundary.");
      qc.invalidateQueries({ queryKey: ["customer-subscription", subscriptionId] });
      qc.invalidateQueries({ queryKey: ["customer-subscription-events", subscriptionId] });
      qc.invalidateQueries({ queryKey: ["customer-subscriptions"] });
    },
    onError: (err) => toast.error(readApiError(err)),
  });

  const cancelMutation = useMutation({
    mutationFn: (mode: CancelMode) =>
      subscriptionsApi.cancel(subscriptionId, { mode }),
    onSuccess: () => {
      toast.success(
        cancelMode === "IMMEDIATE"
          ? "Subscription cancelled."
          : "Cancellation scheduled at period end.",
      );
      setConfirmOpen(false);
      const keys = [
        ["customer-subscription", subscriptionId],
        ["customer-subscription-events", subscriptionId],
        ["customer-subscriptions"],
        ["customer-credits"],
        ["customer-billing-activity"],
        ["customer-billing-activity-infinite"],
        ["customer-invoices"],
      ];
      for (const k of keys) qc.invalidateQueries({ queryKey: k });
    },
    onError: (err) => toast.error(readApiError(err)),
  });

  if (!subscriptionId) {
    return <CustomerErrorState description="Subscription context is missing." />;
  }
  if (subQuery.isPending) return <CustomerLoadingState message="Loading subscription…" />;
  if (subQuery.isError || !subQuery.data) {
    return (
      <CustomerErrorState
        description="We couldn't load this subscription."
        retryAction={() => subQuery.refetch()}
      />
    );
  }

  const sub = subQuery.data;
  const events = eventsQuery.data ?? [];
  const invoicesForSub = (invoicesQuery.data?.data ?? []).filter(
    (inv) => inv.subscription?.id === sub.id,
  );

  const paymentInvoice = invoicesForSub.find(
    (invoice) => invoice.status === "OPEN" && invoice.total > 0,
  );

  const canCancel =
    sub.status === "ACTIVE" && !sub.cancelAtPeriodEnd && !sub.cancelledAt;

  const providerName = sub.plan?.service?.name ?? "Service";
  const businessName =
    (sub.plan?.service as { business?: { name: string } } | undefined)?.business?.name ??
    null;

  const openCancel = (mode: CancelMode) => {
    setCancelMode(mode);
    setConfirmOpen(true);
  };

  return (
    <div className="space-y-6">
      <Link
        to="/customer/subscriptions"
        className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-ink-muted)] transition hover:text-[var(--color-ink)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to subscriptions
      </Link>

      {/* Hero */}
      <section className="glass relative overflow-hidden rounded-3xl p-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
          <div>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3.5">
                <ServiceAvatar name={providerName} size="lg" />
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-subtle)]">
                    {businessName ? `${businessName} · ` : ""}
                    {providerName}
                  </p>
                  <h1 className="font-display mt-1 text-2xl font-semibold tracking-tight text-[var(--color-ink)] sm:text-3xl">
                    {sub.plan?.name ?? "Plan"}
                  </h1>
                </div>
              </div>
              <StatusPill status={sub.status} />
            </div>

            {sub.plan?.description ? (
              <p className="mt-4 max-w-2xl text-sm leading-6 text-[var(--color-ink-muted)]">
                {sub.plan.description}
              </p>
            ) : null}

            <div className="mt-6 flex items-baseline gap-1.5">
              <MoneyText amount={sub.price} currency={sub.currency} size="hero" />
              <span className="text-sm text-[var(--color-ink-muted)]">
                /{sub.billingInterval === "MONTHLY" ? "month" : "year"}
              </span>
            </div>
          </div>

          <aside className="rounded-2xl border border-[rgba(20,22,26,0.08)] bg-white/60 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-subtle)]">
              {sub.status === "CANCELLED"
                ? "Status"
                : sub.cancelAtPeriodEnd
                  ? "Ends on"
                  : "Next payment"}
            </p>
            <p className="font-display mt-1.5 text-lg font-semibold tracking-tight text-[var(--color-ink)]">
              {sub.status === "CANCELLED"
                ? sub.cancelledAt
                  ? `Cancelled ${formatDate(sub.cancelledAt)}`
                  : "Cancelled"
                : formatDate(sub.billingPeriodEnd)}
            </p>
            {sub.status !== "CANCELLED" && !sub.cancelAtPeriodEnd ? (
              <div className="mt-2">
                <MoneyText amount={sub.price} currency={sub.currency} size="sm" />
              </div>
            ) : null}
          </aside>
        </div>
      </section>

      {/* Banners */}
      <NoticeBanners sub={sub} paymentInvoiceId={paymentInvoice?.id} />

      {/* Two-column */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* LEFT */}
        <div className="space-y-6 lg:col-span-7">
          <GlassPanel className="overflow-hidden">
            <PanelHeader title="Subscription" />
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4 px-6 py-5 text-sm">
              <Row label="Plan" value={sub.plan?.name ?? "—"} />
              <Row label="Service" value={providerName} />
              <Row label="Provider" value={businessName ?? "—"} />
              <Row
                label="Billing"
                value={sub.billingInterval === "MONTHLY" ? "Monthly" : "Yearly"}
              />
              <Row
                label="Price"
                value={formatMoney(sub.price, sub.currency)}
              />
              <Row label="Status" value={sub.status} />
              <Row
                label="Period start"
                value={formatDate(sub.billingPeriodStart)}
              />
              <Row
                label="Period end"
                value={formatDate(sub.billingPeriodEnd)}
              />
              <Row label="Started" value={formatDate(sub.createdAt)} />
            </dl>
          </GlassPanel>

          <GlassPanel className="overflow-hidden">
            <PanelHeader
              title="Invoices for this subscription"
              description={
                invoicesQuery.isPending
                  ? "Loading…"
                  : `${invoicesForSub.length} invoice${invoicesForSub.length === 1 ? "" : "s"}`
              }
            />
            {invoicesQuery.isPending ? (
              <p className="px-6 py-10 text-center text-sm text-[var(--color-ink-muted)]">
                Loading invoices…
              </p>
            ) : invoicesQuery.isError ? (
              <p className="px-6 py-10 text-center text-sm text-[var(--color-ink-muted)]">
                We couldn't load invoices.
              </p>
            ) : invoicesForSub.length === 0 ? (
              <p className="px-6 py-10 text-center text-sm text-[var(--color-ink-muted)]">
                No invoices yet for this subscription.
              </p>
            ) : (
              <ul className="divide-y divide-[rgba(20,22,26,0.06)]">
                {invoicesForSub.map((inv) => (
                  <li key={inv.id}>
                    <Link
                      to={`/customer/invoices/${inv.id}`}
                      className="flex items-center gap-3 px-6 py-3.5 transition hover:bg-white/50"
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/70 text-[var(--color-ink-muted)] ring-1 ring-white/60">
                        <FileText className="h-3.5 w-3.5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-[var(--color-ink)]">
                          {inv.invoiceNumber}
                        </p>
                        <p className="truncate text-xs text-[var(--color-ink-muted)]">
                          Issued {formatDate(inv.issuedAt)}
                        </p>
                      </div>
                      <MoneyText amount={inv.total} currency={inv.currency} size="sm" />
                      <StatusPill status={inv.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </GlassPanel>
        </div>

        {/* RIGHT */}
        <div className="lg:col-span-5">
          <GlassPanel className="overflow-hidden">
            <PanelHeader title="Activity" />
            {eventsQuery.isPending ? (
              <p className="px-6 py-10 text-center text-sm text-[var(--color-ink-muted)]">
                Loading activity…
              </p>
            ) : eventsQuery.isError ? (
              <div className="px-6 py-8 text-center">
                <p className="text-sm text-[var(--color-ink-muted)]">
                  We couldn't load activity.
                </p>
                <button
                  type="button"
                  onClick={() => eventsQuery.refetch()}
                  className="mt-2 text-xs font-semibold text-[var(--color-ink)] underline underline-offset-4"
                >
                  Try again
                </button>
              </div>
            ) : events.length === 0 ? (
              <p className="px-6 py-10 text-center text-sm text-[var(--color-ink-muted)]">
                No events yet.
              </p>
            ) : (
              <ol className="relative px-6 py-5">
                <span
                  aria-hidden
                  className="absolute bottom-6 left-[2.05rem] top-6 w-px bg-[rgba(20,22,26,0.08)]"
                />
                {events.map((ev) => {
                  const { title, subtitle, invoiceId } = describeEvent(ev);
                  const Icon = eventIcon(ev.type);
                  return (
                    <li key={ev.id} className="relative flex items-start gap-3 py-3">
                      <span className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white ring-1 ring-white/60">
                        <Icon className="h-3.5 w-3.5 text-[var(--color-ink-muted)]" />
                      </span>
                      <div className="min-w-0 flex-1 pt-0.5">
                        <p className="text-sm font-medium leading-5 text-[var(--color-ink)]">
                          {title}
                        </p>
                        {subtitle ? (
                          <p className="mt-0.5 text-xs text-[var(--color-ink-muted)]">
                            {subtitle}
                          </p>
                        ) : null}
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[var(--color-ink-subtle)]">
                          <span>{formatDateTime(ev.createdAt)}</span>
                          {invoiceId ? (
                            <Link
                              to={`/customer/invoices/${invoiceId}`}
                              className="font-semibold text-[var(--color-ink)] underline underline-offset-4"
                            >
                              View invoice
                            </Link>
                          ) : null}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </GlassPanel>
        </div>
      </div>

      {/* Plan changes */}
      {sub.status === "ACTIVE" && !sub.pendingPlanId && !sub.cancelAtPeriodEnd ? (
        <GlassPanel className="overflow-hidden">
          <PanelHeader
            title="Change plan"
            description="Upgrades create a prorated invoice. Downgrades take effect at the next billing boundary."
          />
          {catalogQuery.isPending ? (
            <p className="px-6 py-6 text-sm text-[var(--color-ink-muted)]">Loading available plans…</p>
          ) : catalogQuery.isError ? (
            <p className="px-6 py-6 text-sm text-[var(--color-ink-muted)]">We couldn't load other plans.</p>
          ) : (
            <div className="grid gap-3 p-6 sm:grid-cols-2">
              {(catalogQuery.data ?? [])
                .flatMap((business) => business.services)
                .find((service) => service.id === sub.plan?.service?.id)?.plans
                .filter((plan) => plan.id !== sub.planId && plan.currency === sub.currency)
                .map((plan) => {
                  const upgrade = plan.price > sub.price;
                  const pending = upgradeMutation.isPending || downgradeMutation.isPending;
                  const details = [
                    plan.description || "Recurring access to this service.",
                    `Billed ${plan.interval === "MONTHLY" ? "monthly" : "yearly"}`,
                    `${plan.currency} billing`,
                  ];
                  return (
                    <div key={plan.id} className="group rounded-3xl border border-[rgba(20,22,26,0.08)] bg-white/65 p-5 transition hover:-translate-y-0.5 hover:bg-white">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-lg font-semibold tracking-tight text-[var(--color-ink)]">{plan.name}</p>
                          <div className="mt-2 flex items-baseline gap-1.5"><MoneyText amount={plan.price} currency={plan.currency} size="lg" /><span className="text-xs text-[var(--color-ink-subtle)]">/{plan.interval === "MONTHLY" ? "mo" : "yr"}</span></div>
                        </div>
                        <span className={upgrade ? "rounded-full bg-[var(--color-positive-soft)] px-2.5 py-1 text-[10px] font-semibold text-[var(--color-positive)]" : "rounded-full bg-[rgba(20,22,26,0.05)] px-2.5 py-1 text-[10px] font-semibold text-[var(--color-ink-muted)]"}>{upgrade ? "Upgrade" : "Downgrade"}</span>
                      </div>
                      <div className="mt-5 space-y-2.5">
                        {details.map((detail) => <p key={detail} className="flex gap-2 text-xs leading-5 text-[var(--color-ink-muted)]"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--color-positive)]" />{detail}</p>)}
                      </div>
                      <button type="button" disabled={pending} onClick={() => upgrade ? upgradeMutation.mutate(plan.id) : downgradeMutation.mutate(plan.id)} className="mt-5 w-full rounded-2xl bg-[var(--color-charcoal)] px-4 py-2.5 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-50">{pending ? "Updating…" : upgrade ? "Upgrade & review payment" : "Schedule downgrade"}</button>
                    </div>
                  );
                }) ?? null}
            </div>
          )}
        </GlassPanel>
      ) : null}

      {/* Actions */}
      {canCancel ? (
        <section className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => openCancel("PERIOD_END")}
            className="glass flex items-center justify-between gap-3 rounded-3xl px-5 py-4 text-left transition hover:-translate-y-0.5"
          >
            <div>
              <p className="text-sm font-semibold text-[var(--color-ink)]">
                Cancel at period end
              </p>
              <p className="mt-0.5 text-xs text-[var(--color-ink-muted)]">
                Stay active until {formatDate(sub.billingPeriodEnd)}.
              </p>
            </div>
            <CalendarClock className="h-5 w-5 text-[var(--color-ink-muted)]" />
          </button>

          <button
            type="button"
            onClick={() => openCancel("IMMEDIATE")}
            className="glass flex items-center justify-between gap-3 rounded-3xl px-5 py-4 text-left transition hover:-translate-y-0.5"
          >
            <div>
              <p className="text-sm font-semibold text-[var(--color-negative)]">
                Cancel immediately
              </p>
              <p className="mt-0.5 text-xs text-[var(--color-ink-muted)]">
                Unused time may be added as credit.
              </p>
            </div>
            <Ban className="h-5 w-5 text-[var(--color-negative)]" />
          </button>
        </section>
      ) : null}

      <CustomerConfirmDialog
        isOpen={confirmOpen}
        title={
          cancelMode === "IMMEDIATE"
            ? "Cancel immediately?"
            : "Cancel at period end?"
        }
        description={
          cancelMode === "IMMEDIATE"
            ? "The subscription will be cancelled immediately. Any unused time may be added to your account as credit. This can't be undone."
            : `The subscription will remain active until the current billing period ends on ${formatDate(sub.billingPeriodEnd)}.`
        }
        confirmLabel={
          cancelMode === "IMMEDIATE"
            ? "Cancel immediately"
            : "Schedule cancellation"
        }
        cancelLabel="Keep subscription"
        onConfirm={() => cancelMutation.mutate(cancelMode)}
        onCancel={() => setConfirmOpen(false)}
        isLoading={cancelMutation.isPending}
        isDestructive
      />
    </div>
  );
}

/* ────────── Sub-components ────────── */

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-ink-subtle)]">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-[var(--color-ink)]">{value}</dd>
    </div>
  );
}

function NoticeBanners({
  sub,
  paymentInvoiceId,
}: {
  sub: Subscription;
  paymentInvoiceId?: string;
}) {
  const items: { tone: "amber" | "red" | "grey"; text: ReactNode }[] = [];

  if (sub.pendingPlanId) {
    const pendingName = sub.pendingPlan?.name;
    const isUpgrade = Boolean(sub.pendingPlan && sub.pendingPlan.price > sub.price);
    items.push({
      tone: "amber",
      text: pendingName ? (
        <>
          {isUpgrade ? "Upgrade awaiting payment — " : "Downgrade scheduled — "}
          {isUpgrade ? <>complete the open invoice to move to </> : <>you&apos;ll move to </>}
          <span className="font-semibold">{pendingName}</span>
          {!isUpgrade ? " at the next renewal." : "."}
          {isUpgrade ? (
            <Link
              to={
                paymentInvoiceId
                  ? `/customer/payment/${paymentInvoiceId}`
                  : "/customer/invoices"
              }
              className="ml-1 font-semibold underline underline-offset-4"
            >
              {paymentInvoiceId ? "Pay invoice" : "Review invoice"}
            </Link>
          ) : null}
        </>
      ) : (
        <>A plan change is pending.</>
      ),
    });
  }

  const currentPlanPrice = sub.plan?.price;
  const currentPlanCurrency = sub.plan?.currency;
  const currentPlanInterval = sub.plan?.interval;

  if (
    currentPlanPrice !== undefined &&
    currentPlanCurrency !== undefined &&
    (currentPlanPrice !== sub.price ||
      currentPlanCurrency !== sub.currency ||
      currentPlanInterval !== sub.billingInterval)
  ) {
    items.push({
      tone: "amber",
      text: (
        <>
          Plan pricing has been updated. Your current billing remains at{" "}
          <span className="font-semibold">
            {formatMoney(sub.price, sub.currency)} /
            {sub.billingInterval === "MONTHLY" ? "month" : "year"}
          </span>{" "}
          for this billing period. The updated price of{" "}
          <span className="font-semibold">
            {formatMoney(currentPlanPrice, currentPlanCurrency)} /
            {currentPlanInterval === "MONTHLY" ? "month" : "year"}
          </span>{" "}
          will apply from your next billing cycle.
        </>
      ),
    });
  }

  if (sub.cancelAtPeriodEnd && !sub.cancelledAt) {
    items.push({
      tone: "amber",
      text: (
        <>
          Cancellation scheduled — your subscription stays active until{" "}
          <span className="font-semibold">{formatDate(sub.billingPeriodEnd)}</span>
          .
        </>
      ),
    });
  }

  if (sub.status === "PAST_DUE") {
    items.push({
      tone: "red",
      text: (
        <>
          Your last payment failed.{" "}
          <Link
            to={
              paymentInvoiceId
                ? `/customer/payment/${paymentInvoiceId}`
                : "/customer/invoices"
            }
            className="font-semibold underline underline-offset-4"
          >
            {paymentInvoiceId ? "Pay invoice" : "Review invoices"}
          </Link>
        </>
      ),
    });
  }

  if (sub.status === "PENDING") {
    items.push({
      tone: "amber",
      text: (
        <>
          Awaiting payment.{" "}
          <Link
            to={
              paymentInvoiceId
                ? `/customer/payment/${paymentInvoiceId}`
                : "/customer/invoices"
            }
            className="font-semibold underline underline-offset-4"
          >
            {paymentInvoiceId ? "Pay now" : "View invoice"}
          </Link>
        </>
      ),
    });
  }

  if (items.length === 0) return null;

  return (
    <section className="space-y-3">
      {items.map((item, i) => (
        <div
          key={i}
          className={
            item.tone === "red"
              ? "flex items-start gap-3 rounded-2xl border-l-4 border-[var(--color-negative)] bg-[var(--color-negative-soft)] px-4 py-3 text-sm text-[#8f2f28]"
              : "flex items-start gap-3 rounded-2xl border-l-4 border-[var(--color-warning)] bg-[var(--color-warning-soft)] px-4 py-3 text-sm text-[#7c540f]"
          }
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="min-w-0">{item.text}</div>
        </div>
      ))}
    </section>
  );
}

function eventIcon(type: string) {
  const t = type.toUpperCase();
  if (t.includes("UPGRADE")) return ArrowUpCircle;
  if (t.includes("DOWNGRADE")) return ArrowDownCircle;
  if (t.includes("CANCEL")) return Ban;
  if (t.includes("RENEW")) return RefreshCw;
  if (t.includes("SUCCEED")) return CheckCircle2;
  if (t.includes("FAIL")) return XCircle;
  if (t.includes("CREATE")) return Sparkles;
  return CalendarClock;
}

function describeEvent(ev: SubscriptionEvent): {
  title: string;
  subtitle?: string;
  invoiceId?: string;
} {
  const m = (ev.metadata ?? {}) as Record<string, unknown>;
  const s = (k: string) => (typeof m[k] === "string" ? (m[k] as string) : undefined);
  const n = (k: string) => (typeof m[k] === "number" ? (m[k] as number) : undefined);
  const currency = s("currency") ?? "INR";

  switch (String(ev.type)) {
    case "CREATED": {
      const plan = s("planName");
      const price = n("price");
      const interval = s("billingInterval");
      return {
        title: plan ? `Subscribed to ${plan}` : "Subscription created",
        subtitle:
          price !== undefined
            ? `${formatMoney(price, currency)} / ${interval === "YEARLY" ? "yr" : "mo"}`
            : undefined,
      };
    }
    case "PAYMENT_SUCCEEDED": {
      const amount = n("amount");
      const method = s("paymentMethod");
      return {
        title:
          amount !== undefined
            ? `Payment of ${formatMoney(amount, currency)} succeeded`
            : "Payment succeeded",
        subtitle: method,
        invoiceId: s("invoiceId"),
      };
    }
    case "PAYMENT_FAILED": {
      const amount = n("amount");
      return {
        title:
          amount !== undefined
            ? `Payment of ${formatMoney(amount, currency)} failed`
            : "Payment failed",
        invoiceId: s("invoiceId"),
      };
    }
    case "RENEWED": {
      const plan = s("planName");
      const recovered = m["recoveredFromPastDue"] === true;
      return {
        title: plan ? `Renewed on ${plan}` : "Subscription renewed",
        subtitle: recovered ? "Recovered from past due" : undefined,
        invoiceId: s("invoiceId"),
      };
    }
    case "UPGRADED": {
      const from = s("fromPlanName");
      const to = s("toPlanName");
      return {
        title:
          from && to ? `Upgraded from ${from} to ${to}` : "Plan upgraded",
      };
    }
    case "DOWNGRADE_SCHEDULED": {
      const from = s("fromPlanName");
      const to = s("toPlanName");
      const eff = s("effectiveAt");
      return {
        title:
          from && to
            ? `Downgrade from ${from} to ${to} scheduled`
            : "Downgrade scheduled",
        subtitle: eff ? `Effective ${formatDate(eff)}` : undefined,
      };
    }
    case "DOWNGRADE_APPLIED": {
      const from = s("fromPlanName");
      const to = s("toPlanName");
      return {
        title:
          from && to ? `Downgraded from ${from} to ${to}` : "Plan downgraded",
      };
    }
    case "CANCEL_REQUESTED": {
      const eff = s("effectiveAt");
      return {
        title: "Cancellation requested",
        subtitle: eff ? `Effective ${formatDate(eff)}` : undefined,
      };
    }
    case "CANCELLED": {
      const mode = s("mode");
      const credit = n("creditCreated");
      if (mode === "IMMEDIATE" && credit && credit > 0) {
        return {
          title: `Cancelled immediately · ${formatMoney(credit, currency)} added as credit`,
        };
      }
      return {
        title:
          mode === "IMMEDIATE"
            ? "Cancelled immediately"
            : "Subscription cancelled",
      };
    }
      default:
        return {
          title: String(ev.type)
            .toLowerCase()
            .split("_")
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" "),
        };
  }
}



