import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  FileText,
  Loader2,
  Package,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";

import { invoicesApi } from "../../api/invoices";
import { paymentsApi } from "../../api/payments";
import { StatusBadge } from "../../components/status-badge";
import { ErrorState } from "../../components/error-state";
import { SectionCard } from "../../components/section-card";
import { Button } from "../../components/ui/button";
import { queryClient } from "../../lib/query-client";

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

function formatDate(value: string | null) {
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

function formatDateTime(value: string | null) {
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

  const [paymentResult, setPaymentResult] =
    useState<"SUCCESS" | "FAILED">("SUCCESS");

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

  const paymentMutation = useMutation({
    mutationFn: async () => {
      if (!businessId || !invoiceId) {
        throw new Error("INVOICE_CONTEXT_MISSING");
      }

      return paymentsApi.create(
        businessId,
        {
          invoiceId,
          paymentMethod: "DEMO",
          result: paymentResult,
        },
      );
    },

    onSuccess: (result) => {
      queryClient.invalidateQueries({
        queryKey: [
          "invoice",
          businessId,
          invoiceId,
        ],
      });

      queryClient.invalidateQueries({
        queryKey: [
          "invoices",
          businessId,
        ],
      });

      queryClient.invalidateQueries({
        queryKey: [
          "payments",
          businessId,
        ],
      });

      queryClient.invalidateQueries({
        queryKey: [
          "subscriptions",
          businessId,
        ],
      });

      queryClient.invalidateQueries({
        queryKey: [
          "subscription",
          businessId,
        ],
      });

      queryClient.invalidateQueries({
        queryKey: [
          "credit-balance",
          businessId,
        ],
      });

      if (result.success) {
        toast.success(
          "Payment successful. The invoice has been paid.",
        );
      } else {
        toast.error(
          "Payment failed. The invoice is still awaiting payment.",
        );
      }
    },

    onError: (error) => {
      if (axios.isAxiosError(error)) {
        toast.error(
          error.response?.data?.error?.message ??
            "Payment could not be processed.",
        );
        return;
      }

      toast.error("Payment could not be processed.");
    },
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
  const subscription = invoice.subscription;
  const canPay =
    invoice.status === "OPEN";

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <Link
        to={`/customer/${businessId}/invoices`}
        className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition-colors hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to invoices
      </Link>

      <header className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">
            Billing document
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-gray-950">
            {invoice.invoiceNumber}
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Issued {formatDate(invoice.issuedAt)}
          </p>
        </div>

        <StatusBadge status={invoice.status} />
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
                {invoice.items.map((item) => (
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
                ))}
              </div>
            )}

            <div className="mt-8 space-y-3 border-t border-gray-100 pt-5">
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

              <div className="flex justify-between text-sm">
                <span className="text-gray-500">
                  Tax
                  {invoice.taxRate > 0
                    ? ` (${invoice.taxRate}%)`
                    : ""}
                </span>

                <span className="font-medium text-gray-900">
                  {formatMoney(
                    invoice.taxAmount,
                    invoice.currency,
                  )}
                </span>
              </div>

              <div className="flex justify-between border-t border-gray-100 pt-4">
                <span className="font-semibold text-gray-950">
                  Total
                </span>

                <span className="text-xl font-bold text-gray-950">
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

              <Link
                to={`/customer/${businessId}/subscriptions/${subscription.id}`}
                className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-indigo-600"
              >
                View subscription
                <ArrowLeft className="h-4 w-4 rotate-180" />
              </Link>
            </SectionCard>
          )}
        </div>

        <div className="space-y-6">
          <SectionCard
            title="Payment"
            description="Current payment state for this invoice."
          >
            <div className="flex items-start gap-3">
              {invoice.status === "PAID" ? (
                <CheckCircle2 className="mt-0.5 h-6 w-6 text-emerald-600" />
              ) : invoice.status === "VOID" ? (
                <XCircle className="mt-0.5 h-6 w-6 text-gray-400" />
              ) : (
                <CreditCard className="mt-0.5 h-6 w-6 text-amber-600" />
              )}

              <div>
                <p className="font-semibold text-gray-900">
                  {invoice.status === "PAID"
                    ? "Payment completed"
                    : invoice.status === "VOID"
                      ? "Invoice voided"
                      : "Payment required"}
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  {invoice.paidAt
                    ? `Paid on ${formatDateTime(invoice.paidAt)}`
                    : invoice.status === "OPEN"
                      ? "This invoice is awaiting payment."
                      : "No successful payment is recorded on this invoice."}
                </p>
              </div>
            </div>

            {canPay && (
              <>
                <div className="mt-6 space-y-3">
                  <button
                    type="button"
                    onClick={() =>
                      setPaymentResult("SUCCESS")
                    }
                    className={`flex w-full items-center justify-between rounded-xl border p-4 text-left transition ${
                      paymentResult === "SUCCESS"
                        ? "border-indigo-300 bg-indigo-50"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />

                      <div>
                        <p className="font-medium text-gray-900">
                          Successful payment
                        </p>

                        <p className="text-xs text-gray-500">
                          Mark this invoice as paid
                        </p>
                      </div>
                    </div>

                    {paymentResult === "SUCCESS" && (
                      <span className="text-xs font-semibold text-indigo-600">
                        Selected
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setPaymentResult("FAILED")
                    }
                    className={`flex w-full items-center justify-between rounded-xl border p-4 text-left transition ${
                      paymentResult === "FAILED"
                        ? "border-red-300 bg-red-50"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <XCircle className="h-5 w-5 text-red-500" />

                      <div>
                        <p className="font-medium text-gray-900">
                          Failed payment
                        </p>

                        <p className="text-xs text-gray-500">
                          Test the failed-payment scenario
                        </p>
                      </div>
                    </div>

                    {paymentResult === "FAILED" && (
                      <span className="text-xs font-semibold text-red-600">
                        Selected
                      </span>
                    )}
                  </button>
                </div>

                <Button
                  className="mt-5 w-full bg-gray-950 hover:bg-gray-800"
                  disabled={paymentMutation.isPending}
                  onClick={() =>
                    paymentMutation.mutate()
                  }
                >
                  {paymentMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : paymentResult === "SUCCESS" ? (
                    "Pay invoice"
                  ) : (
                    "Run failed payment"
                  )}
                </Button>

                <div className="mt-4 flex gap-3 rounded-xl bg-gray-50 p-4 text-xs leading-5 text-gray-500">
                  <ShieldCheck className="h-4 w-4 shrink-0" />

                  <span>
                    This uses the controlled DEMO payment system.
                    No real card, bank, UPI or payment information
                    is collected.
                  </span>
                </div>
              </>
            )}

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

          <SectionCard title="Invoice information">
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
                  <StatusBadge status={invoice.status} />
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
                  {formatDate(invoice.issuedAt)}
                </dd>
              </div>

              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">
                  Due
                </dt>

                <dd className="font-medium text-gray-900">
                  {formatDate(invoice.dueAt)}
                </dd>
              </div>

              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">
                  Tax
                </dt>

                <dd className="text-right font-medium text-gray-900">
                  {invoice.taxRate}% ·{" "}
                  {formatMoney(
                    invoice.taxAmount,
                    invoice.currency,
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