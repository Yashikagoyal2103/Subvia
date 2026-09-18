import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  FileText,
  Loader2,
  Package,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { invoicesApi } from "../../api/invoices";
import { StatusBadge } from "../../components/status-badge";
import { ErrorState } from "../../components/error-state";
import { SectionCard } from "../../components/section-card";

const currencySymbol: Record<string, string> = {
  INR: "₹",
  USD: "$",
};

function formatMoney(
  amount: number,
  currency: string,
) {
  const symbol =
    currencySymbol[currency] ?? currency;

  return `${symbol}${(
    amount / 100
  ).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(
  value: string | null,
) {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  );
}

function formatDateTime(
  value: string | null,
) {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  );
}

export function CustomerInvoiceDetailsPage() {
  const {
    businessId,
    invoiceId,
  } = useParams<{
    businessId: string;
    invoiceId: string;
  }>();

  const query = useQuery({
    queryKey: [
      "invoice",
      businessId,
      invoiceId,
    ],
    queryFn: () =>
      invoicesApi.getById(
        businessId!,
        invoiceId!,
      ),
    enabled:
      Boolean(businessId) &&
      Boolean(invoiceId),
  });

  if (!businessId || !invoiceId) {
    return (
      <ErrorState
        description="Invoice information is missing."
      />
    );
  }

  if (query.isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <ErrorState
        description="We couldn't load this invoice."
        retryAction={() => query.refetch()}
      />
    );
  }

  const invoice = query.data;
  const subscription =
    invoice.subscription;

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <Link
        to={`/customer/${businessId}/invoices`}
        className="inline-flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to invoices
      </Link>

      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">
            Billing document
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-gray-900">
            {invoice.invoiceNumber}
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Issued{" "}
            {formatDate(invoice.issuedAt)}
          </p>
        </div>

        <StatusBadge
          status={invoice.status}
        />
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
        <div className="space-y-6">
          <SectionCard
            title="Invoice items"
            description="Charges included in this billing document."
          >
            {invoice.items.length === 0 ? (
              <div className="py-10 text-center">
                <FileText className="mx-auto h-10 w-10 text-gray-300" />

                <p className="mt-3 text-sm text-gray-500">
                  No invoice items were recorded.
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {invoice.items.map(
                  (item) => (
                    <div
                      key={item.id}
                      className="flex items-start justify-between gap-6 border-b border-gray-100 pb-5 last:border-0 last:pb-0"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900">
                          {item.description}
                        </p>

                        <p className="mt-1 text-sm text-gray-400">
                          {item.quantity} ×{" "}
                          {formatMoney(
                            item.unitPrice,
                            invoice.currency,
                          )}
                        </p>
                      </div>

                      <p className="shrink-0 font-semibold text-gray-900">
                        {formatMoney(
                          item.amount,
                          invoice.currency,
                        )}
                      </p>
                    </div>
                  ),
                )}
              </div>
            )}

            <div className="mt-8 border-t border-gray-100 pt-5">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">
                  Subtotal
                </span>

                <span className="font-medium text-gray-900">
                  {formatMoney(
                    invoice.subtotal,
                    invoice.currency,
                  )}
                </span>
              </div>

              <div className="mt-3 flex justify-between border-t border-gray-100 pt-4">
                <span className="font-semibold text-gray-900">
                  Total
                </span>

                <span className="text-xl font-bold text-gray-900">
                  {formatMoney(
                    invoice.total,
                    invoice.currency,
                  )}
                </span>
              </div>
            </div>
          </SectionCard>

          {subscription && (
            <SectionCard
              title="Subscription"
              description="Subscription associated with this invoice."
            >
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50">
                  <Package className="h-5 w-5 text-indigo-600" />
                </div>

                <div className="min-w-0">
                  <p className="font-semibold text-gray-900">
                    {subscription.plan.service.name}
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    {subscription.plan.name}
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                    Billing period
                  </p>

                  <p className="mt-2 text-sm font-medium text-gray-900">
                    {formatDate(
                      subscription.billingPeriodStart,
                    )}
                    {" — "}
                    {formatDate(
                      subscription.billingPeriodEnd,
                    )}
                  </p>
                </div>

                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                    Billing interval
                  </p>

                  <p className="mt-2 text-sm font-medium text-gray-900">
                    {subscription.billingInterval ===
                    "MONTHLY"
                      ? "Monthly"
                      : "Yearly"}
                  </p>
                </div>
              </div>
            </SectionCard>
          )}
        </div>

        <div className="space-y-6">
          <SectionCard
            title="Payment"
            description="Current payment state for this invoice."
          >
            <div className="flex items-start gap-3">
              {invoice.status ===
              "PAID" ? (
                <CheckCircle2 className="mt-0.5 h-6 w-6 text-emerald-600" />
              ) : (
                <CreditCard className="mt-0.5 h-6 w-6 text-amber-600" />
              )}

              <div>
                <p className="font-semibold text-gray-900">
                  {invoice.status ===
                  "PAID"
                    ? "Payment completed"
                    : invoice.status ===
                        "VOID"
                      ? "Invoice voided"
                      : "Payment pending"}
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  {invoice.paidAt
                    ? `Paid on ${formatDateTime(invoice.paidAt)}`
                    : "No successful payment is recorded on this invoice."}
                </p>
              </div>
            </div>

            <div className="mt-6 border-t border-gray-100 pt-5">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">
                  Amount
                </span>

                <span className="font-semibold text-gray-900">
                  {formatMoney(
                    invoice.total,
                    invoice.currency,
                  )}
                </span>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Invoice information"
          >
            <dl className="space-y-4 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">
                  Invoice number
                </dt>

                <dd className="font-medium text-gray-900">
                  {invoice.invoiceNumber}
                </dd>
              </div>

              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">
                  Status
                </dt>

                <dd>
                  <StatusBadge
                    status={
                      invoice.status
                    }
                  />
                </dd>
              </div>

              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">
                  Currency
                </dt>

                <dd className="font-medium text-gray-900">
                  {invoice.currency}
                </dd>
              </div>

              <div className="flex items-center justify-between gap-4">
                <dt className="flex items-center gap-2 text-gray-500">
                  <CalendarDays className="h-4 w-4" />
                  Issued
                </dt>

                <dd className="font-medium text-gray-900">
                  {formatDate(
                    invoice.issuedAt,
                  )}
                </dd>
              </div>

              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">
                  Due
                </dt>

                <dd className="font-medium text-gray-900">
                  {formatDate(
                    invoice.dueAt,
                  )}
                </dd>
              </div>
            </dl>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}