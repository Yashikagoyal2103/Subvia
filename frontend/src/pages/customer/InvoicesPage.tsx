import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useInfiniteQuery } from "@tanstack/react-query";
import { ChevronRight, FileText, Loader2, Search, X } from "lucide-react";

import { invoicesApi, type Invoice } from "@/api/invoices";
import { formatDate } from "@/lib/customer-utils";

import { CustomerPageHeader } from "@/components/customer/CustomerPageHeader";
import { GlassPanel } from "@/components/customer/GlassPanel";
import { MoneyText } from "@/components/customer/MoneyText";
import { SegmentedControl, type SegmentedOption } from "@/components/customer/SegmentedControl";
import { StatusPill } from "@/components/customer/StatusPill";
import { PageSkeleton } from "@/components/customer/Skeleton";
import { CustomerErrorState } from "@/components/customer/CustomerErrorState";
import { CustomerEmptyState } from "@/components/customer/CustomerEmptyState";

type StatusFilter = "ALL" | "OPEN" | "PAID" | "VOID" | "DRAFT";

const PAGE_SIZE = 20;

export function CustomerInvoicesPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");

  const query = useInfiniteQuery({
    queryKey: ["customer-invoices", "list"],
    queryFn: ({ pageParam }) =>
      invoicesApi.list(pageParam as number, PAGE_SIZE),
    initialPageParam: 1,
    getNextPageParam: (last) => {
      if (!last || !last.pagination) return undefined;
      return last.pagination.hasNextPage
        ? last.pagination.page + 1
        : undefined;
    },
  });

  const allInvoices = useMemo(
    () => query.data?.pages.flatMap((p) => p.data) ?? [],
    [query.data],
  );

  const counts = useMemo(() => {
    const c = { ALL: allInvoices.length, OPEN: 0, PAID: 0, VOID: 0, DRAFT: 0 };
    for (const i of allInvoices) {
      if (i.status === "OPEN") c.OPEN++;
      else if (i.status === "PAID") c.PAID++;
      else if (i.status === "VOID") c.VOID++;
      else if (i.status === "DRAFT") c.DRAFT++;
    }
    return c;
  }, [allInvoices]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allInvoices.filter((inv) => {
      if (statusFilter !== "ALL" && inv.status !== statusFilter) return false;
      if (!q) return true;
      const svc = inv.subscription?.plan.service.name?.toLowerCase() ?? "";
      const plan = inv.subscription?.plan.name?.toLowerCase() ?? "";
      return (
        inv.invoiceNumber.toLowerCase().includes(q) ||
        svc.includes(q) ||
        plan.includes(q)
      );
    });
  }, [allInvoices, search, statusFilter]);

  // ▼ MOVED UP — must run on every render, not just the success render.
  const grouped = useMemo(() => {
    const map = new Map<string, { paid: number; open: number }>();
    for (const inv of allInvoices) {
      const bucket = map.get(inv.currency) ?? { paid: 0, open: 0 };
      if (inv.status === "PAID") bucket.paid += inv.total;
      else if (inv.status === "OPEN") bucket.open += inv.total;
      map.set(inv.currency, bucket);
    }
    return map;
  }, [allInvoices]);

  const options: SegmentedOption<StatusFilter>[] = [
    { value: "ALL", label: "All", count: counts.ALL },
    { value: "OPEN", label: "Open", count: counts.OPEN },
    { value: "PAID", label: "Paid", count: counts.PAID },
    { value: "VOID", label: "Void", count: counts.VOID },
    { value: "DRAFT", label: "Draft", count: counts.DRAFT },
  ].filter(
    (o) => o.value === "ALL" || (o.count ?? 0) > 0,
  ) as SegmentedOption<StatusFilter>[];

  // ▼ NOW the early returns are safe — no more hooks below them.
  if (query.isPending) return <PageSkeleton />;
  if (query.isError) {
    return (
      <CustomerErrorState
        description="We couldn't load your invoices."
        retryAction={() => query.refetch()}
      />
    );
  }

  return (
        <div className="space-y-8">
      <CustomerPageHeader
        eyebrow="Billing"
        title="Invoices"
        description="Every invoice generated for your subscriptions."
      />

      {/* Summary strip */}
      <GlassPanel className="overflow-hidden p-0">
        <div className="grid grid-cols-2 gap-px bg-[rgba(20,22,26,0.06)] sm:grid-cols-4">
          <SummaryCell label="Total invoices" value={String(counts.ALL)} />
          <SummaryCell label="Paid" value={String(counts.PAID)} />
          <SummaryCell label="Open" value={String(counts.OPEN)} />
          <div className="bg-white/60 p-5 backdrop-blur">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-subtle)]">
              Billed
            </p>
            {grouped.size === 0 ? (
              <p className="mt-2 text-sm text-[var(--color-ink-muted)]">
                No invoices yet
              </p>
            ) : (
              <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                {Array.from(grouped.entries()).map(([cur, b]) => (
                  <MoneyText
                    key={cur}
                    amount={b.paid + b.open}
                    currency={cur}
                    size="lg"
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </GlassPanel>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-ink-subtle)]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by invoice number, service or plan…"
            className="glass h-11 w-full rounded-full pl-11 pr-11 text-sm text-[var(--color-ink)] outline-none placeholder:text-[var(--color-ink-subtle)] focus:ring-2 focus:ring-[var(--color-charcoal)]/20"
          />
          {search ? (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Clear search"
              className="absolute right-4 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-[var(--color-ink-muted)] transition hover:bg-white/70 hover:text-[var(--color-ink)]"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>

        <SegmentedControl value={statusFilter} onChange={setStatusFilter} options={options} />
      </div>

      {allInvoices.length === 0 ? (
        <CustomerEmptyState
          icon={FileText}
          title="No invoices yet"
          description="Invoices appear here after billing activity occurs."
        />
      ) : filtered.length === 0 ? (
        <GlassPanel className="px-6 py-12 text-center">
          <p className="text-sm text-[var(--color-ink-muted)]">
            No invoices match your filters.
          </p>
        </GlassPanel>
      ) : (
        <>
          {/* Desktop table */}
          <GlassPanel className="hidden overflow-hidden md:block">
            <div className="grid grid-cols-[minmax(0,1.3fr)_minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto_auto] items-center gap-3 border-b border-[rgba(20,22,26,0.06)] bg-white/60 px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-ink-subtle)] backdrop-blur">
              <span>Invoice</span>
              <span>Service</span>
              <span>Issued</span>
              <span>Due</span>
              <span className="text-right">Amount</span>
              <span>Status</span>
              <span />
            </div>
            <ul className="divide-y divide-[rgba(20,22,26,0.06)]">
              {filtered.map((inv) => (
                <li key={inv.id}>
                  <Link
                    to={`/customer/invoices/${inv.id}`}
                    className="group grid grid-cols-[minmax(0,1.3fr)_minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto_auto] items-center gap-3 px-5 py-3.5 transition hover:bg-white/50"
                  >
                    <span className="text-sm font-medium text-[var(--color-ink)]">
                      {inv.invoiceNumber}
                    </span>
                    <span className="truncate text-sm text-[var(--color-ink-muted)]">
                      {inv.subscription
                        ? `${inv.subscription.plan.service.name} · ${inv.subscription.plan.name}`
                        : "—"}
                    </span>
                    <span className="text-sm text-[var(--color-ink-muted)]">
                      {formatDate(inv.issuedAt)}
                    </span>
                    <span className="text-sm text-[var(--color-ink-muted)]">
                      {formatDate(inv.dueAt)}
                    </span>
                    <span className="text-right">
                      <MoneyText amount={inv.total} currency={inv.currency} size="sm" />
                    </span>
                    <span className="flex flex-col items-start gap-1">
                      <StatusPill status={inv.status} />
                      {inv.status === "PAID" && inv.paidAt ? (
                        <span className="text-[10px] text-[var(--color-ink-subtle)]">
                          Paid {formatDate(inv.paidAt)}
                        </span>
                      ) : null}
                    </span>
                    <ChevronRight className="h-4 w-4 text-[var(--color-ink-subtle)] transition group-hover:translate-x-0.5 group-hover:text-[var(--color-ink)]" />
                  </Link>
                </li>
              ))}
            </ul>
          </GlassPanel>

          {/* Mobile stacked */}
          <div className="space-y-3 md:hidden">
            {filtered.map((inv) => (
              <MobileCard key={inv.id} inv={inv} />
            ))}
          </div>

          {query.hasNextPage ? (
            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={() => query.fetchNextPage()}
                disabled={query.isFetchingNextPage}
                className="inline-flex items-center gap-2 rounded-full bg-[var(--color-charcoal)] px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
              >
                {query.isFetchingNextPage ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Loading…
                  </>
                ) : (
                  "Load more"
                )}
              </button>
            </div>
          ) : null}
        </>
      )}
    </div>

  );
}

function SummaryCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/60 p-5 backdrop-blur">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-subtle)]">
        {label}
      </p>
      <p className="font-display mt-2 text-2xl font-semibold tracking-tight text-[var(--color-ink)]">
        {value}
      </p>
    </div>
  );
}

function MobileCard({ inv }: { inv: Invoice }) {
  return (
    <Link
      to={`/customer/invoices/${inv.id}`}
      className="glass block rounded-3xl p-5 transition hover:-translate-y-0.5"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[var(--color-ink)]">
            {inv.invoiceNumber}
          </p>
          <p className="mt-0.5 text-xs text-[var(--color-ink-muted)]">
            {inv.subscription
              ? `${inv.subscription.plan.service.name} · ${inv.subscription.plan.name}`
              : "Invoice"}
          </p>
        </div>
        <StatusPill status={inv.status} />
      </div>
      <div className="mt-4 flex items-end justify-between border-t border-[rgba(20,22,26,0.06)] pt-3">
        <span className="text-xs text-[var(--color-ink-muted)]">
          Issued {formatDate(inv.issuedAt)}
          {inv.dueAt ? ` · Due ${formatDate(inv.dueAt)}` : ""}
        </span>
        <MoneyText amount={inv.total} currency={inv.currency} size="md" />
      </div>
    </Link>
  );
}