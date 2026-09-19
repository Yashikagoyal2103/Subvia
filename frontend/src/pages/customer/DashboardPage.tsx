import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  CreditCard,
  FileText,
  Package,
  Receipt,
  WalletCards,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { invoicesApi } from "../../api/invoices";
import { paymentsApi } from "../../api/payments";
import { subscriptionsApi } from "../../api/subscriptions";
import { creditsApi } from "../../api/credits";
import { StatusBadge } from "../../components/status-badge";
import { LoadingState } from "../../components/loading-state";
import { ErrorState } from "../../components/error-state";

const currencySymbol: Record<string, string> = {
  INR: "₹",
  USD: "$",
};

function money(amount: number, currency: string) {
  return `${currencySymbol[currency] ?? currency}${(
    amount / 100
  ).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function date(value: string | null | undefined) {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function CustomerDashboardPage() {
  const { businessId } = useParams<{
    businessId: string;
  }>();

  const subscriptionsQuery = useQuery({
    queryKey: ["subscriptions", businessId],
    queryFn: () => subscriptionsApi.list(businessId!),
    enabled: Boolean(businessId),
  });

  const invoicesQuery = useQuery({
    queryKey: ["invoices", businessId],
    queryFn: () => invoicesApi.list(businessId!),
    enabled: Boolean(businessId),
  });

  const paymentsQuery = useQuery({
    queryKey: ["payments", businessId],
    queryFn: () => paymentsApi.list(businessId!),
    enabled: Boolean(businessId),
  });

  const creditsQuery = useQuery({
    queryKey: ["credit-balance", businessId],
    queryFn: () => creditsApi.getBalance(businessId!),
    enabled: Boolean(businessId),
  });

  if (!businessId) {
    return (
      <ErrorState description="A valid business context is required." />
    );
  }

  const isLoading =
    subscriptionsQuery.isLoading ||
    invoicesQuery.isLoading ||
    paymentsQuery.isLoading ||
    creditsQuery.isLoading;

  const hasError =
    subscriptionsQuery.isError ||
    invoicesQuery.isError ||
    paymentsQuery.isError ||
    creditsQuery.isError;

  if (isLoading) {
    return <LoadingState message="Loading your billing overview..." />;
  }

  if (hasError) {
    return (
      <ErrorState
        description="We couldn't load your billing overview."
        retryAction={() => {
          subscriptionsQuery.refetch();
          invoicesQuery.refetch();
          paymentsQuery.refetch();
          creditsQuery.refetch();
        }}
      />
    );
  }

  const subscriptions = subscriptionsQuery.data ?? [];
  const invoices = invoicesQuery.data?.data ?? [];
  const payments = paymentsQuery.data ?? [];

  const activeSubscriptions = subscriptions.filter(
    (subscription) => subscription.status === "ACTIVE",
  );

  const pendingSubscriptions = subscriptions.filter(
    (subscription) => subscription.status === "PENDING",
  );

  const openInvoices = invoices.filter(
    (invoice) => invoice.status === "OPEN",
  );

  const paidInvoices = invoices.filter(
    (invoice) => invoice.status === "PAID",
  );

  const successfulPayments = payments.filter(
    (payment) => payment.status === "SUCCESS",
  );

  const outstandingByCurrency = openInvoices.reduce<
    Record<string, number>
  >((accumulator, invoice) => {
    accumulator[invoice.currency] =
      (accumulator[invoice.currency] ?? 0) + invoice.total;

    return accumulator;
  }, {});

  const latestSubscription = [...activeSubscriptions].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() -
      new Date(a.createdAt).getTime(),
  )[0];

  const latestInvoices = [...invoices]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime(),
    )
    .slice(0, 5);

  const latestPayments = [...payments]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime(),
    )
    .slice(0, 4);

  const totalCredits =
    (creditsQuery.data?.INR ?? 0) +
    (creditsQuery.data?.USD ?? 0);

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <section className="relative overflow-hidden rounded-3xl border border-gray-200 bg-white p-7 shadow-sm sm:p-9">
        <div className="absolute right-0 top-0 h-48 w-48 translate-x-16 -translate-y-16 rounded-full bg-indigo-100/60 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-32 w-32 rounded-full bg-purple-100/40 blur-3xl" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
              <WalletCards className="h-3.5 w-3.5" />
              Customer billing
            </div>

            <h1 className="text-3xl font-semibold tracking-tight text-gray-950 sm:text-4xl">
              Your billing overview
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
              Keep track of subscriptions, invoices, payments and
              available billing credit from one place.
            </p>
          </div>

          <Link
            to={`/customer/${businessId}/services`}
            className="inline-flex w-fit items-center gap-2 rounded-xl bg-gray-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800"
          >
            Explore services
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardStat
          icon={<Package className="h-5 w-5" />}
          label="Active subscriptions"
          value={activeSubscriptions.length}
          description={
            pendingSubscriptions.length > 0
              ? `${pendingSubscriptions.length} awaiting payment`
              : "Currently active"
          }
        />

        <DashboardStat
          icon={<Receipt className="h-5 w-5" />}
          label="Invoices"
          value={invoices.length}
          description={`${paidInvoices.length} paid`}
        />

        <DashboardStat
          icon={<CreditCard className="h-5 w-5" />}
          label="Successful payments"
          value={successfulPayments.length}
          description="Recorded payment attempts"
        />

        <DashboardStat
          icon={<WalletCards className="h-5 w-5" />}
          label="Credit balance"
          value={
            totalCredits > 0
              ? "Available"
              : "None"
          }
          description={
            totalCredits > 0
              ? "Can reduce eligible invoices"
              : "No account credit available"
          }
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
            <div>
              <h2 className="font-semibold text-gray-950">
                Current subscription
              </h2>
              <p className="mt-1 text-xs text-gray-500">
                Your most recently created active subscription.
              </p>
            </div>

            <Link
              to={`/customer/${businessId}/subscriptions`}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              View all
            </Link>
          </div>

          {latestSubscription ? (
            <div className="p-6">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <Package className="h-5 w-5" />
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-gray-950">
                        {latestSubscription.plan?.name ??
                          "Subscription"}
                      </h3>

                      <StatusBadge
                        status={latestSubscription.status}
                      />
                    </div>

                    <p className="mt-1 text-sm text-gray-500">
                      {latestSubscription.plan?.service?.name ??
                        "Service"}
                    </p>
                  </div>
                </div>

                <Link
                  to={`/customer/${businessId}/subscriptions/${latestSubscription.id}`}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  Manage
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <InfoTile
                  label="Billing"
                  value={money(
                    latestSubscription.price,
                    latestSubscription.currency,
                  )}
                  detail={`per ${latestSubscription.billingInterval.toLowerCase()}`}
                />

                <InfoTile
                  label="Current period"
                  value={date(
                    latestSubscription.billingPeriodStart,
                  )}
                  detail={`until ${date(
                    latestSubscription.billingPeriodEnd,
                  )}`}
                />

                <InfoTile
                  label="Next billing"
                  value={date(
                    latestSubscription.billingPeriodEnd,
                  )}
                  detail="Billing boundary"
                />
              </div>
            </div>
          ) : (
            <div className="p-10 text-center">
              <Package className="mx-auto h-9 w-9 text-gray-300" />

              <h3 className="mt-4 font-semibold text-gray-900">
                No active subscription
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Browse the catalog to choose a plan.
              </p>

              <Link
                to={`/customer/${businessId}/services`}
                className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-indigo-600"
              >
                Browse services
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-6 py-5">
            <h2 className="font-semibold text-gray-950">
              Outstanding invoices
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              Open billing documents requiring payment.
            </p>
          </div>

          <div className="p-6">
            {openInvoices.length === 0 ? (
              <div className="py-7 text-center">
                <CheckCircle2 className="mx-auto h-9 w-9 text-emerald-500" />

                <p className="mt-3 font-medium text-gray-900">
                  You're all caught up
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  There are no open invoices.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(outstandingByCurrency).map(
                  ([currency, amount]) => (
                    <div
                      key={currency}
                      className="rounded-xl border border-amber-100 bg-amber-50/60 p-4"
                    >
                      <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">
                        {currency} outstanding
                      </p>

                      <p className="mt-2 text-2xl font-bold text-gray-950">
                        {money(amount, currency)}
                      </p>
                    </div>
                  ),
                )}

                <Link
                  to={`/customer/${businessId}/invoices`}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600"
                >
                  Review invoices
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
            <div>
              <h2 className="font-semibold text-gray-950">
                Recent invoices
              </h2>
              <p className="mt-1 text-xs text-gray-500">
                Your latest billing documents.
              </p>
            </div>

            <Link
              to={`/customer/${businessId}/invoices`}
              className="text-sm font-medium text-indigo-600"
            >
              View all
            </Link>
          </div>

          <div className="divide-y divide-gray-100">
            {latestInvoices.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-500">
                No invoices yet.
              </div>
            ) : (
              latestInvoices.map((invoice) => (
                <Link
                  key={invoice.id}
                  to={`/customer/${businessId}/invoices/${invoice.id}`}
                  className="flex items-center justify-between gap-4 px-6 py-4 transition hover:bg-gray-50"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-50">
                      <FileText className="h-4 w-4 text-gray-500" />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-900">
                        {invoice.invoiceNumber}
                      </p>

                      <p className="mt-0.5 text-xs text-gray-400">
                        {date(invoice.issuedAt)}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold text-gray-900">
                      {money(invoice.total, invoice.currency)}
                    </p>

                    <div className="mt-1">
                      <StatusBadge status={invoice.status} />
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
            <div>
              <h2 className="font-semibold text-gray-950">
                Recent payment activity
              </h2>
              <p className="mt-1 text-xs text-gray-500">
                Latest payment attempts.
              </p>
            </div>

            <Link
              to={`/customer/${businessId}/billing`}
              className="text-sm font-medium text-indigo-600"
            >
              View all
            </Link>
          </div>

          <div className="divide-y divide-gray-100">
            {latestPayments.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-500">
                No payment activity yet.
              </div>
            ) : (
              latestPayments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between gap-4 px-6 py-4"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                        payment.status === "SUCCESS"
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-red-50 text-red-500"
                      }`}
                    >
                      {payment.status === "SUCCESS" ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <CreditCard className="h-4 w-4" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900">
                        {payment.paymentMethod} payment
                      </p>

                      <p className="mt-0.5 text-xs text-gray-400">
                        {date(payment.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold text-gray-900">
                      {money(payment.amount, payment.currency)}
                    </p>

                    <div className="mt-1">
                      <StatusBadge status={payment.status} />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <QuickLink
          href={`/customer/${businessId}/services`}
          icon={<Package className="h-5 w-5" />}
          title="Browse services"
          description="Explore available plans."
        />

        <QuickLink
          href={`/customer/${businessId}/invoices`}
          icon={<FileText className="h-5 w-5" />}
          title="View invoices"
          description="Review billing documents."
        />

        <QuickLink
          href={`/customer/${businessId}/credits`}
          icon={<CalendarClock className="h-5 w-5" />}
          title="Check credits"
          description="View available billing credit."
        />
      </section>
    </div>
  );
}

function DashboardStat({
  icon,
  label,
  value,
  description,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 text-gray-600">
          {icon}
        </div>
      </div>

      <p className="mt-5 text-sm text-gray-500">
        {label}
      </p>

      <p className="mt-1 text-2xl font-bold tracking-tight text-gray-950">
        {value}
      </p>

      <p className="mt-1 text-xs text-gray-400">
        {description}
      </p>
    </div>
  );
}

function InfoTile({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
        {label}
      </p>

      <p className="mt-2 truncate text-sm font-semibold text-gray-900">
        {value}
      </p>

      <p className="mt-1 truncate text-xs text-gray-400">
        {detail}
      </p>
    </div>
  );
}

function QuickLink({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Link
      to={href}
      className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
    >
      <div className="flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
          {icon}
        </div>

        <ArrowRight className="h-4 w-4 text-gray-300 transition group-hover:translate-x-1 group-hover:text-indigo-500" />
      </div>

      <h3 className="mt-5 font-semibold text-gray-900">
        {title}
      </h3>

      <p className="mt-1 text-sm text-gray-500">
        {description}
      </p>
    </Link>
  );
}