
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Compass,
  FileText,
  Inbox,
  Sparkles,
  Wallet,
} from "lucide-react";
import { subscriptionsApi } from "@/api/subscriptions";
import type { Subscription } from "@/api/subscriptions";
import { invoicesApi } from "@/api/invoices";
import type { Invoice } from "@/api/invoices";
import { creditsApi } from "@/api/credits";
import { billingActivityApi } from "@/api/billing-activity";
import type { BillingActivity } from "@/api/billing-activity";

import { useAuthStore } from "@/stores/auth.store";
import { formatMoney } from "@/lib/format";
import { dayGroupLabel, formatDate, groupBy } from "@/lib/customer-utils";

import { GlassPanel } from "@/components/customer/GlassPanel";
import { PanelHeader } from "@/components/customer/PanelHeader";
import { CustomerPageHeader } from "@/components/customer/CustomerPageHeader";
import { MoneyText } from "@/components/customer/MoneyText";
import { StatusPill } from "@/components/customer/StatusPill";
import { ServiceAvatar } from "@/components/customer/ServiceAvatar";
import { PageSkeleton } from "@/components/customer/Skeleton";
import { CustomerErrorState } from "@/components/customer/CustomerErrorState";
import { cn } from "@/lib/utils";


function greetingLine(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function todayLine(): string {
  return new Date().toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function CustomerDashboardPage() {
  const user = useAuthStore((s) => s.user);

  const subsQuery = useQuery({
    queryKey: ["customer-subscriptions"],
    queryFn: () => subscriptionsApi.list(),
  });
  const invoicesQuery = useQuery({
    queryKey: ["customer-invoices"],
    queryFn: () => invoicesApi.list(),
  });
  const creditsQuery = useQuery({
    queryKey: ["customer-credits"],
    queryFn: () => creditsApi.getBalance(),
  });
  const activityQuery = useQuery({
    queryKey: ["customer-billing-activity"],
    queryFn: () => billingActivityApi.list(),
  });

  if (
    subsQuery.isPending ||
    invoicesQuery.isPending ||
    creditsQuery.isPending ||
    activityQuery.isPending
  ) {
    return <PageSkeleton />;
  }

  if (
    subsQuery.isError ||
    invoicesQuery.isError ||
    creditsQuery.isError ||
    activityQuery.isError
  ) {
    return (
      <CustomerErrorState
        description="We couldn't load your billing overview."
        retryAction={() => {
          subsQuery.refetch();
          invoicesQuery.refetch();
          creditsQuery.refetch();
          activityQuery.refetch();
        }}
      />
    );
  }

  const subs = subsQuery.data ?? [];
  const invoices = invoicesQuery.data?.data ?? [];
  const credits = creditsQuery.data ?? { INR: 0, USD: 0 };
  const activity = activityQuery.data?.data ?? [];

  return (
    <DashboardContent
      firstName={user?.firstName ?? ""}
      subs={subs}
      invoices={invoices}
      creditsINR={credits.INR}
      creditsUSD={credits.USD}
      activity={activity}
    />
  );
}

interface DashboardContentProps {
  firstName: string;
  subs: Subscription[];
  invoices: Invoice[];
  creditsINR: number;
  creditsUSD: number;
  activity: BillingActivity[];
}

function DashboardContent({
  firstName,
  subs,
  invoices,
  creditsINR,
  creditsUSD,
  activity,
}: DashboardContentProps) {
  const fanSubs = subs
    .filter(
      (s) =>
        s.status === "ACTIVE" || s.status === "PAST_DUE" || s.status === "PENDING",
    )
    .slice(0, 5);

  const activeSubs = subs.filter((s) => s.status === "ACTIVE");
  const pastDueSubs = subs.filter((s) => s.status === "PAST_DUE");
  const openInvoices = invoices.filter((i) => i.status === "OPEN");

  const outstandingByCurrency = new Map<string, number>();
  for (const inv of openInvoices) {
    outstandingByCurrency.set(
      inv.currency,
      (outstandingByCurrency.get(inv.currency) ?? 0) + inv.total,
    );
  }

  const creditEntries = [
    creditsINR > 0 ? { currency: "INR" as const, amount: creditsINR } : null,
    creditsUSD > 0 ? { currency: "USD" as const, amount: creditsUSD } : null,
  ].filter((x): x is { currency: "INR" | "USD"; amount: number } => x !== null);

  const nextBilling =
    [...activeSubs].sort(
      (a, b) =>
        new Date(a.billingPeriodEnd).getTime() -
        new Date(b.billingPeriodEnd).getTime(),
    )[0] ?? null;

  const currencyCounts = new Map<string, number>();
  for (const inv of invoices) {
    currencyCounts.set(inv.currency, (currencyCounts.get(inv.currency) ?? 0) + 1);
  }
  const dominantCurrency =
    [...currencyCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "INR";

  const paidCount = invoices.filter((i) => i.status === "PAID").length;
  const openCount = invoices.filter((i) => i.status === "OPEN").length;
  const invoiceCount = invoices.length;
  const paidShare = invoiceCount ? Math.round((paidCount / invoiceCount) * 100) : 0;
  const topServices = Array.from(
    activeSubs.reduce((map, sub) => {
      if (sub.currency !== dominantCurrency) return map;
      const name = sub.plan?.service?.name ?? "Other";
      map.set(name, (map.get(name) ?? 0) + sub.price);
      return map;
    }, new Map<string, number>()).entries(),
  )
    .map(([name, value]) => ({ name, value: value / 100 }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 3);

  // Recent activity groups
  const activityGroups = groupBy(activity, (item) => dayGroupLabel(item.createdAt));

  // Recent lists
  const recentSubs = subs.slice(0, 4);
  const recentInvoices = invoices.slice(0, 4);

  return (
    <div className="space-y-8">
      <CustomerPageHeader
        title={`${greetingLine()}, ${firstName || "there"}`}
        description={todayLine()}
        actions={
          <Link
            to="/customer/explore"
            className="inline-flex items-center gap-2 rounded-full bg-[var(--color-charcoal)] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_30px_-10px_rgba(20,22,26,0.5)] transition hover:opacity-90"
          >
            Explore services
            <ArrowRight className="h-4 w-4" />
          </Link>
        }
      />

      {/* Fan hero + stat strip */}
      <section className="relative">
        {fanSubs.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-[rgba(20,22,26,0.14)] bg-white/40 px-6 py-16 text-center">
            <Sparkles className="h-6 w-6 text-[var(--color-ink-subtle)]" />
            <p className="mt-3 text-sm font-semibold text-[var(--color-ink)]">
              No active subscriptions
            </p>
            <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
              Explore services to start your first subscription.
            </p>
            <Link
              to="/customer/explore"
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-[var(--color-charcoal)] px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Explore services
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <>
            {/* Mobile — snap scroll */}
            <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 md:hidden">
              {fanSubs.map((sub) => (
                <div
                  key={sub.id}
                  className="w-[78vw] max-w-[300px] shrink-0 snap-start"
                >
                  <FanCard sub={sub} />
                </div>
              ))}
            </div>

            {/* Desktop — fanned absolute */}
            <div className="relative hidden h-[340px] md:block">
              {fanSubs.map((sub, i) => {
                const total = fanSubs.length;
                const mid = (total - 1) / 2;
                const offset = i - mid;
                const xOffset = offset * 90;
                const rotation = offset * 6;
                const translateY = Math.abs(offset) * 26;
                const scale = 1 - Math.abs(offset) * 0.06;
                const zIndex = 10 - Math.round(Math.abs(offset) * 2);

                return (
                  <div
                    key={sub.id}
                    className="absolute left-1/2 top-0 w-[260px]"
                    style={{
                      transform: `translateX(calc(-50% + ${xOffset}px)) translateY(${translateY}px) rotate(${rotation}deg) scale(${scale})`,
                      zIndex,
                      transition: "transform 300ms ease",
                    }}
                  >
                    <FanCard sub={sub} />
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Stat strip — overlaps the fan */}
        <div className="relative z-20 mx-auto mt-6 max-w-5xl md:-mt-16">
          <GlassPanel className="overflow-hidden p-0">
            <div className="grid grid-cols-2 gap-px bg-[rgba(20,22,26,0.06)] lg:grid-cols-4">
              <StatCell label="Active subscriptions">
                <p className="font-display text-2xl font-semibold tracking-tight text-[var(--color-ink)]">
                  {activeSubs.length}
                </p>
                {pastDueSubs.length > 0 ? (
                  <p className="mt-0.5 text-xs font-medium text-[var(--color-negative)]">
                    {pastDueSubs.length} past due
                  </p>
                ) : null}
              </StatCell>

              <StatCell label="Open invoices">
                <p className="font-display text-2xl font-semibold tracking-tight text-[var(--color-ink)]">
                  {openInvoices.length}
                </p>
                {outstandingByCurrency.size > 0 ? (
                  <p className="mt-0.5 truncate text-xs text-[var(--color-ink-muted)]">
                    {Array.from(outstandingByCurrency.entries())
                      .map(([cur, amt]) => formatMoney(amt, cur))
                      .join(" · ")}{" "}
                    outstanding
                  </p>
                ) : null}
              </StatCell>

              <StatCell label="Credit">
                {creditEntries.length > 0 ? (
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                    {creditEntries.map((c) => (
                      <MoneyText
                        key={c.currency}
                        amount={c.amount}
                        currency={c.currency}
                        size="lg"
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-[var(--color-ink-muted)]">No credit yet</p>
                )}
              </StatCell>

              <StatCell label="Next billing">
                {nextBilling ? (
                  <>
                    <p className="font-display text-lg font-semibold tracking-tight text-[var(--color-ink)]">
                      {nextBilling.cancelAtPeriodEnd ? "Ends " : ""}
                      {formatDate(nextBilling.billingPeriodEnd)}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-[var(--color-ink-muted)]">
                      {nextBilling.plan?.service?.name ?? "Service"} ·{" "}
                      {nextBilling.plan?.name ?? "Plan"}
                    </p>
                    <div className="mt-1">
                      <MoneyText
                        amount={nextBilling.price}
                        currency={nextBilling.currency}
                        size="sm"
                      />
                      <span className="ml-1 text-xs text-[var(--color-ink-subtle)]">
                        /{nextBilling.billingInterval === "MONTHLY" ? "mo" : "yr"}
                      </span>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-[var(--color-ink-muted)]">Nothing scheduled</p>
                )}
              </StatCell>
            </div>
          </GlassPanel>
        </div>
      </section>

      {/* Billing overview + service spend + activity */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <GlassPanel className="overflow-hidden">
            <PanelHeader
              title="Billing overview"
              description="A clear view of your invoice status."
            />
            <div className="p-6">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-subtle)]">Total billed ({dominantCurrency})</p>
                  <MoneyText
                    amount={invoices.filter((i) => i.currency === dominantCurrency).reduce((sum, i) => sum + i.total, 0)}
                    currency={dominantCurrency}
                    size="hero"
                  />
                </div>
                <span className="rounded-full bg-[var(--color-positive-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--color-positive)]">{paidShare}% paid</span>
              </div>

              <div className="mt-7 space-y-5">
                <BillingBar label="Paid invoices" count={paidCount} total={invoiceCount} tone="positive" />
                <BillingBar label="Open invoices" count={openCount} total={invoiceCount} tone="warning" />
              </div>

              <div className="mt-7 grid gap-3 sm:grid-cols-3">
                <MiniMetric label="Invoices" value={String(invoiceCount)} />
                <MiniMetric label="Open" value={String(openCount)} />
                <MiniMetric label="Credits" value={creditEntries.length ? creditEntries.map((c) => formatMoney(c.amount, c.currency)).join(" · ") : "—"} />
              </div>
            </div>
          </GlassPanel>
        </div>

        <div className="space-y-6 lg:col-span-5">
          <GlassPanel className="overflow-hidden">
            <PanelHeader title="Spend by service" description={`Active subscriptions in ${dominantCurrency}.`} />
            <div className="space-y-4 p-6">
              {topServices.length === 0 ? (
                <p className="py-8 text-center text-sm text-[var(--color-ink-muted)]">No active subscriptions in {dominantCurrency}.</p>
              ) : topServices.map((service, index) => {
                const max = topServices[0].value || 1;
                return (
                  <div key={service.name}>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="truncate font-medium text-[var(--color-ink)]">{service.name}</span>
                      <MoneyText amount={service.value * 100} currency={dominantCurrency} size="sm" />
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-[rgba(20,22,26,0.06)]">
                      <div className="h-full rounded-full bg-[var(--color-charcoal)]" style={{ width: `${Math.max(12, (service.value / max) * 100)}%`, opacity: 1 - index * 0.18 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </GlassPanel>

          <GlassPanel className="overflow-hidden">
            <PanelHeader title="Recent activity" />
            {activityGroups.length === 0 ? (
              <p className="px-6 py-10 text-center text-sm text-[var(--color-ink-muted)]">No activity yet.</p>
            ) : (
              <div className="space-y-4 px-6 py-5">
                {activityGroups.slice(0, 2).map(([label, items]) => (
                  <div key={String(label)}>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-subtle)]">{label}</p>
                    <ul className="mt-2 space-y-1">{items.slice(0, 3).map((item) => <li key={item.id}><ActivityRow item={item} /></li>)}</ul>
                  </div>
                ))}
              </div>
            )}
          </GlassPanel>
        </div>
      </section>

      {/* Bottom row — subscriptions + invoices */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <GlassPanel className="overflow-hidden">
          <PanelHeader
            title="Your subscriptions"
            action={
              <Link
                to="/customer/subscriptions"
                className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-ink-muted)] transition hover:text-[var(--color-ink)]"
              >
                View all
                <ArrowRight className="h-3 w-3" />
              </Link>
            }
          />
          {recentSubs.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-[var(--color-ink-muted)]">
              No subscriptions yet.
            </p>
          ) : (
            <ul className="divide-y divide-[rgba(20,22,26,0.06)]">
              {recentSubs.map((sub) => (
                <li key={sub.id}>
                  <Link
                    to={`/customer/subscriptions/${sub.id}`}
                    className="flex items-center gap-3 px-6 py-3.5 transition hover:bg-white/50"
                  >
                    <ServiceAvatar
                      name={sub.plan?.service?.name ?? "Service"}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[var(--color-ink)]">
                        {sub.plan?.service?.name ?? "Service"} ·{" "}
                        {sub.plan?.name ?? "Plan"}
                      </p>
                      <p className="truncate text-xs text-[var(--color-ink-muted)]">
                        {formatDate(sub.billingPeriodEnd)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <MoneyText
                        amount={sub.price}
                        currency={sub.currency}
                        size="sm"
                      />
                      <StatusPill status={sub.status} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </GlassPanel>

        <GlassPanel className="overflow-hidden">
          <PanelHeader
            title="Recent invoices"
            action={
              <Link
                to="/customer/invoices"
                className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-ink-muted)] transition hover:text-[var(--color-ink)]"
              >
                View all
                <ArrowRight className="h-3 w-3" />
              </Link>
            }
          />
          {recentInvoices.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-[var(--color-ink-muted)]">
              No invoices yet.
            </p>
          ) : (
            <ul className="divide-y divide-[rgba(20,22,26,0.06)]">
              {recentInvoices.map((inv) => (
                <li key={inv.id}>
                  <Link
                    to={`/customer/invoices/${inv.id}`}
                    className="flex items-center gap-3 px-6 py-3.5 transition hover:bg-white/50"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/70 text-[var(--color-ink-muted)] ring-1 ring-white/60">
                      <FileText className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[var(--color-ink)]">
                        {inv.invoiceNumber}
                      </p>
                      <p className="truncate text-xs text-[var(--color-ink-muted)]">
                        {formatDate(inv.createdAt)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <MoneyText amount={inv.total} currency={inv.currency} size="sm" />
                      <StatusPill status={inv.status} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </GlassPanel>
      </section>

      {/* Promo card */}
      <section className="relative overflow-hidden rounded-3xl border border-white/60 bg-gradient-to-br from-[#fbf3e7] via-[#f3ecf6] to-[#f7ecec] p-6 shadow-[0_24px_60px_-30px_rgba(20,22,26,0.25)]">
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/80 text-[var(--color-ink)] ring-1 ring-white/60">
              <Compass className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-subtle)]">
                Discover
              </p>
              <h3 className="font-display mt-1 text-lg font-semibold tracking-tight text-[var(--color-ink)]">
                Discover more services
              </h3>
              <p className="mt-1 max-w-md text-sm text-[var(--color-ink-muted)]">
                Browse services and plans available to you.
              </p>
            </div>
          </div>
          <Link
            to="/customer/explore"
            className="inline-flex items-center gap-2 rounded-full bg-[var(--color-charcoal)] px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Explore
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}

/* ────────── Sub-components (not exported — lint-safe) ────────── */

function FanCard({ sub }: { sub: Subscription }) {
  const serviceName = sub.plan?.service?.name ?? "Service";
  const planName = sub.plan?.name ?? "Plan";

  return (
    <Link
      to={`/customer/subscriptions/${sub.id}`}
      className="pearl-card group block rounded-3xl p-5 shadow-[0_24px_50px_-24px_rgba(20,22,26,0.28)] ring-1 ring-white/60 transition-transform duration-300 hover:-translate-y-1"
    >
      <div className="flex items-start justify-between gap-3">
        <ServiceAvatar name={serviceName} size="md" />
        <span
          className={
            sub.status === "ACTIVE"
              ? "mt-1 h-2 w-2 rounded-full bg-[var(--color-positive)]"
              : sub.status === "PENDING"
                ? "mt-1 h-2 w-2 rounded-full bg-[var(--color-warning)]"
                : "mt-1 h-2 w-2 rounded-full bg-[var(--color-negative)]"
          }
          aria-hidden
        />
      </div>

      <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-ink-muted)]">
        {serviceName}
      </p>
      <p className="font-display mt-1 text-lg font-semibold tracking-tight text-[var(--color-ink)]">
        {planName}
      </p>

      <div className="mt-4 flex items-baseline gap-1">
        <MoneyText amount={sub.price} currency={sub.currency} size="xl" />
        <span className="text-xs text-[var(--color-ink-muted)]">
          /{sub.billingInterval === "MONTHLY" ? "mo" : "yr"}
        </span>
      </div>
    </Link>
  );
}

interface StatCellProps {
  label: string;
  children: ReactNode;
}

function BillingBar({ label, count, total, tone }: { label: string; count: number; total: number; tone: "positive" | "warning" }) {
  const width = total ? Math.max(4, Math.round((count / total) * 100)) : 4;
  return (
    <div>
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-medium text-[var(--color-ink)]">{label}</span>
        <span className="text-xs text-[var(--color-ink-muted)]">{count} of {total}</span>
      </div>
      <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-[rgba(20,22,26,0.06)]">
        <div className={cn("h-full rounded-full", tone === "positive" ? "bg-[var(--color-positive)]" : "bg-[var(--color-warning)]")} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl bg-[rgba(20,22,26,0.035)] p-4"><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-ink-subtle)]">{label}</p><p className="mt-1.5 truncate text-sm font-semibold text-[var(--color-ink)]">{value}</p></div>;
}

function StatCell({ label, children }: StatCellProps) {
  return (
    <div className="bg-white/60 p-5 backdrop-blur">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-subtle)]">
        {label}
      </p>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function ActivityRow({ item }: { item: BillingActivity }) {
  const isInvoice = item.type === "INVOICE";

  return (
    <Link
      to={`/customer/invoices/${item.invoiceId}`}
      className="flex items-center gap-3 rounded-2xl px-2 py-2 transition hover:bg-white/60"
    >
      <span
        className={
          isInvoice
            ? "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/80 text-[var(--color-ink-muted)] ring-1 ring-white/60"
            : "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-positive-soft)] text-[var(--color-positive)] ring-1 ring-white/60"
        }
      >
        {isInvoice ? (
          <Inbox className="h-3.5 w-3.5" />
        ) : (
          <Wallet className="h-3.5 w-3.5" />
        )}
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-[var(--color-ink)]">
          {isInvoice ? `Invoice ${item.invoiceNumber}` : "Payment"}
        </p>
        <p className="truncate text-xs text-[var(--color-ink-muted)]">
          {isInvoice ? item.service : item.paymentMethod}
        </p>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1">
        <span
          className={
            item.type === "INVOICE"
              ? "text-sm font-semibold tabular-nums text-[var(--color-ink)]"
              : item.status === "SUCCESS"
                ? "text-sm font-semibold tabular-nums text-[var(--color-positive)]"
                : "text-sm font-semibold tabular-nums text-[var(--color-negative)]"
          }
        >
          {item.type === "PAYMENT" && item.status === "SUCCESS" ? "+" : ""}
          {formatMoney(item.amount, item.currency)}
        </span>
        <StatusPill status={item.status} />
      </div>
    </Link>
  );
}

