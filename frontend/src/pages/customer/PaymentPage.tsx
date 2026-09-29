import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, FileText, XCircle } from "lucide-react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { AppLogo } from "@/components/app-logo";
import { invoicesApi } from "@/api/invoices";
import { paymentsApi } from "@/api/payments";
import { DemoPaymentPanel } from "@/components/customer/DemoPaymentPanel";
import { CustomerErrorState } from "@/components/customer/CustomerErrorState";
import { CustomerLoadingState } from "@/components/customer/CustomerLoadingState";
import { GlassPanel } from "@/components/customer/GlassPanel";
import { MoneyText } from "@/components/customer/MoneyText";
import { formatMoney } from "@/lib/format";
import { formatInvoiceDate } from "@/lib/customer-utils";

export function CustomerPaymentPage() {
  const { invoiceId = "" } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [paymentResult, setPaymentResult] = useState<"SUCCESS" | "FAILED" | null>(null);

  const query = useQuery({
    queryKey: ["customer-payment-invoice", invoiceId],
    queryFn: () => invoicesApi.getById(invoiceId),
    enabled: Boolean(invoiceId),
  });

  useEffect(() => {
    if (!paymentResult || !invoiceId) return;

    const timer = window.setTimeout(() => {
      navigate(`/customer/invoices/${invoiceId}`, { replace: true });
    }, 2200);

    return () => window.clearTimeout(timer);
  }, [invoiceId, navigate, paymentResult]);

  const paymentMutation = useMutation({
    mutationFn: (result: "SUCCESS" | "FAILED") =>
      paymentsApi.createForCustomer(invoiceId, {
        paymentMethod: "DEMO",
        result,
      }),
    onSuccess: (result) => {
      for (const key of [
        ["customer-payment-invoice", invoiceId],
        ["customer-invoice", invoiceId],
        ["customer-invoices"],
        ["customer-subscriptions"],
        ["customer-credits"],
        ["customer-billing-activity"],
        ["customer-billing-activity-infinite"],
      ]) {
        qc.invalidateQueries({ queryKey: key });
      }

      setPaymentResult(result.success ? "SUCCESS" : "FAILED");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Payment could not be processed.",
      );
    },
  });

  if (!invoiceId) {
    return <CustomerErrorState description="Payment context is missing." />;
  }

  if (query.isPending) {
    return <CustomerLoadingState message="Preparing payment…" />;
  }

  if (query.isError || !query.data) {
    return (
      <CustomerErrorState
        description="We couldn't load this invoice."
        retryAction={() => query.refetch()}
      />
    );
  }

  const invoice = query.data;
  const canPay =
    invoice.status === "OPEN" &&
    invoice.total > 0 &&
    Boolean(invoice.subscription);

  if (!canPay && !paymentResult) {
    return <Navigate to={`/customer/invoices/${invoiceId}`} replace />;
  }

  if (paymentResult) {
    const success = paymentResult === "SUCCESS";

    return (
      <div className="flex min-h-[65vh] items-center justify-center py-10">
        <GlassPanel strong className="w-full max-w-xl p-8 text-center sm:p-10">
          <div
            className={
              success
                ? "mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-positive-soft)] text-[var(--color-positive)]"
                : "mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-negative-soft)] text-[var(--color-negative)]"
            }
          >
            {success ? (
              <CheckCircle2 className="h-8 w-8" />
            ) : (
              <XCircle className="h-8 w-8" />
            )}
          </div>
          <div className="mb-4 flex justify-center">
            <AppLogo className="h-8" />
          </div>
          <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-ink-subtle)]">
            Subvia Payment
          </p>
          <h1 className="font-display mt-2 text-3xl font-semibold tracking-tight text-[var(--color-ink)]">
            {success ? "Payment successful" : "Payment failed"}
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[var(--color-ink-muted)]">
            {success
              ? "Your payment has been processed and the invoice is now being updated."
              : "Your invoice remains open. You can retry the payment whenever you're ready."}
          </p>
          <div className="mx-auto mt-6 max-w-xs rounded-2xl border border-[rgba(20,22,26,0.07)] bg-white/70 px-5 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-subtle)]">
              {invoice.invoiceNumber}
            </p>
            <MoneyText amount={invoice.total} currency={invoice.currency} size="lg" />
          </div>
          <p className="mt-5 text-xs text-[var(--color-ink-subtle)]">
            Returning to your invoice…
          </p>
        </GlassPanel>
      </div>
    );
  }

  const service = invoice.subscription?.plan.service.name ?? "Subscription";
  const plan = invoice.subscription?.plan.name ?? "Plan";
  const creditApplied = Math.max(
    invoice.subtotal + invoice.taxAmount - invoice.total,
    0,
  );

  return (
    <div className="space-y-7">
      <Link
        to={`/customer/invoices/${invoiceId}`}
        className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to invoice
      </Link>

      <div>
        <AppLogo variant="mark" className="mb-4 h-8" />
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-subtle)]">
          Payment
        </p>
        <h1 className="font-display mt-1 text-3xl font-semibold tracking-tight text-[var(--color-ink)]">
          Complete payment
        </h1>
        <p className="mt-2 text-sm text-[var(--color-ink-muted)]">
          Review the invoice and complete the payment below.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_460px]">
        <DemoPaymentPanel
          amount={invoice.total}
          currency={invoice.currency}
          isPending={paymentMutation.isPending}
          onPay={(result) => paymentMutation.mutate(result)}
          submitLabel={`Pay ${formatMoney(invoice.total, invoice.currency)}`}
        />

        <GlassPanel strong className="overflow-hidden">
          <div className="border-b border-[rgba(20,22,26,0.06)] bg-gradient-to-br from-[#fbf3e7] via-[#f3ecf6] to-[#f7ecec] px-6 py-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-subtle)]">
                  Invoice
                </p>
                <h2 className="font-display mt-2 break-words text-2xl font-semibold tracking-tight text-[var(--color-ink)]">
                  {invoice.invoiceNumber}
                </h2>
                <p className="mt-1 break-words text-xs text-[var(--color-ink-muted)]">
                  {service} · {plan}
                </p>
              </div>
              <FileText className="h-5 w-5 shrink-0 text-[var(--color-ink-muted)]" />
            </div>
          </div>

          <div className="space-y-5 p-6">
            <div className="grid grid-cols-2 gap-5 text-sm">
              <div>
                <p className="label">Issued</p>
                <p className="mt-1 font-medium">{formatInvoiceDate(invoice.issuedAt)}</p>
              </div>
              <div>
                <p className="label">Due</p>
                <p className="mt-1 font-medium">{formatInvoiceDate(invoice.dueAt)}</p>
              </div>
            </div>

            <div className="border-y border-[rgba(20,22,26,0.06)] py-4">
              <div className="flex items-center justify-between gap-4 text-sm">
                <span>{service}</span>
                <span>{formatMoney(invoice.subtotal, invoice.currency)}</span>
              </div>
              <div className="mt-2 flex items-center justify-between gap-4 text-sm text-[var(--color-ink-muted)]">
                <span>Tax ({invoice.taxRate}%)</span>
                <span>{formatMoney(invoice.taxAmount, invoice.currency)}</span>
              </div>
              {creditApplied > 0 ? (
                <div className="mt-2 flex items-center justify-between gap-4 text-sm text-[var(--color-positive)]">
                  <span>Account credit</span>
                  <span>-{formatMoney(creditApplied, invoice.currency)}</span>
                </div>
              ) : null}
            </div>

            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="label">Amount due</p>
                <p className="mt-1 text-xs text-[var(--color-ink-subtle)]">
                  Invoice {invoice.invoiceNumber}
                </p>
              </div>
              <MoneyText amount={invoice.total} currency={invoice.currency} size="lg" />
            </div>

            <Link
              to={`/customer/invoices/${invoiceId}`}
              className="block text-center text-xs font-semibold text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
            >
              View full invoice
            </Link>
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}
