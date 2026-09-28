import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Check, FileText } from "lucide-react";

import { catalogApi } from "@/api/catalog";
import { creditsApi } from "@/api/credits";
import { subscriptionsApi } from "@/api/subscriptions";
import { paymentsApi } from "@/api/payments";
import { DemoPaymentPanel } from "@/components/customer/DemoPaymentPanel";
import { CustomerErrorState } from "@/components/customer/CustomerErrorState";
import { CustomerLoadingState } from "@/components/customer/CustomerLoadingState";
import { GlassPanel } from "@/components/customer/GlassPanel";
import { MoneyText } from "@/components/customer/MoneyText";
import { formatMoney } from "@/lib/format";

export function CheckoutPage() {
  const { planId = "" } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const planQuery = useQuery({
    queryKey: ["checkout-plan", planId],
    queryFn: async () => {
      const catalog = await catalogApi.list();
      for (const business of catalog) {
        for (const service of business.services) {
          const plan = service.plans.find((item) => item.id === planId);
          if (plan) return { business, service, plan };
        }
      }
      return null;
    },
    enabled: Boolean(planId),
  });

  const creditQuery = useQuery({
    queryKey: ["customer-credits"],
    queryFn: () => creditsApi.getBalance(),
  });

  const mutation = useMutation({
    mutationFn: async (result: "SUCCESS" | "FAILED") => {
      if (!planQuery.data) throw new Error("Plan not found.");
      const created = await subscriptionsApi.create({
        planId: planQuery.data.plan.id,
        currency: planQuery.data.plan.currency,
      });
      if (created.invoice.total > 0) {
        const payment = await paymentsApi.createForCustomer(created.invoice.id, {
          paymentMethod: "DEMO",
          result,
        });
        return { created, success: payment.success };
      }
      return { created, success: true };
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["customer-subscriptions"] });
      qc.invalidateQueries({ queryKey: ["customer-invoices"] });
      qc.invalidateQueries({ queryKey: ["customer-credits"] });
      if (data.success) {
        toast.success("Payment successful. Subscription activated.");
        navigate(`/customer/subscriptions/${data.created.subscription.id}`);
      } else {
        toast.error("Payment failed. The invoice remains open for retry.");
        navigate(`/customer/invoices/${data.created.invoice.id}`);
      }
    },
    onError: (error: unknown) => toast.error(error instanceof Error ? error.message : "Checkout failed."),
  });

  if (!planId) return <CustomerErrorState description="Plan context is missing." />;
  if (planQuery.isPending) return <CustomerLoadingState message="Preparing checkout…" />;
  if (planQuery.isError || !planQuery.data) return <CustomerErrorState description="This plan is no longer available." retryAction={() => planQuery.refetch()} />;

  const { business, service, plan } = planQuery.data;
  const credit = creditQuery.data?.[plan.currency] ?? 0;
  const subtotal = plan.price;
  const tax = Math.round((subtotal * business.taxRate) / 100);
  const total = subtotal + tax;
  const creditApplied = Math.min(credit, total);
  const due = Math.max(total - creditApplied, 0);

  return (
    <div className="space-y-7">
      <Link to={`/customer/services/${service.id}`} className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]">
        <ArrowLeft className="h-4 w-4" /> Back to {service.name}
      </Link>

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-subtle)]">Checkout</p>
        <h1 className="font-display mt-1 text-3xl font-semibold tracking-tight text-[var(--color-ink)]">Complete your subscription</h1>
        <p className="mt-2 text-sm text-[var(--color-ink-muted)]">Review the billing details before you continue.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_460px]">
        <DemoPaymentPanel
          amount={due}
          currency={plan.currency}
          isPending={mutation.isPending}
          onPay={(result) => mutation.mutate(result)}
          submitLabel="Subscribe & pay"
          description="Choose a payment method and review the final amount before paying."
        />

        <InvoicePreview
          business={business.name}
          customer="Your account"
          service={service.name}
          plan={plan.name}
          subtotal={subtotal}
          tax={tax}
          taxRate={business.taxRate}
          credit={creditApplied}
          total={due}
          currency={plan.currency}
          interval={plan.interval}
        />
      </div>
    </div>
  );
}

function InvoicePreview({ business, customer, service, plan, subtotal, tax, taxRate, credit, total, currency, interval }: { business: string; customer: string; service: string; plan: string; subtotal: number; tax: number; taxRate: number; credit: number; total: number; currency: "INR" | "USD"; interval: "MONTHLY" | "YEARLY" }) {
  return (
    <GlassPanel strong className="overflow-hidden">
      <div className="border-b border-[rgba(20,22,26,0.06)] bg-gradient-to-br from-[#fbf3e7] via-[#f3ecf6] to-[#f7ecec] px-6 py-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-subtle)]">Invoice preview</p>
            <h2 className="font-display mt-2 text-2xl font-semibold tracking-tight text-[var(--color-ink)]">{service}</h2>
            <p className="mt-1 text-xs text-[var(--color-ink-muted)]">{plan} · billed {interval === "MONTHLY" ? "monthly" : "yearly"}</p>
          </div>
          <FileText className="h-5 w-5 text-[var(--color-ink-muted)]" />
        </div>
      </div>
      <div className="space-y-5 p-6">
        <div className="grid grid-cols-2 gap-5 text-sm">
          <div><p className="label">Billed by</p><p className="mt-1 font-medium">{business}</p></div>
          <div><p className="label">Billed to</p><p className="mt-1 font-medium">{customer}</p></div>
        </div>
        <div className="border-y border-[rgba(20,22,26,0.06)] py-4">
          <div className="flex items-center justify-between gap-4 text-sm"><span>{plan} subscription</span><MoneyText amount={subtotal} currency={currency} size="sm" /></div>
          <div className="mt-2 flex items-center justify-between gap-4 text-sm text-[var(--color-ink-muted)]"><span>Tax ({taxRate}%)</span><span>{formatMoney(tax, currency)}</span></div>
          {credit > 0 ? <div className="mt-2 flex items-center justify-between gap-4 text-sm text-[var(--color-positive)]"><span>Account credit</span><span>-{formatMoney(credit, currency)}</span></div> : null}
        </div>
        <div className="flex items-end justify-between gap-4"><div><p className="label">Amount due</p><p className="mt-1 text-xs text-[var(--color-ink-subtle)]">Final invoice is generated by the billing engine.</p></div><MoneyText amount={total} currency={currency} size="lg" /></div>
        <div className="space-y-2 text-xs text-[var(--color-ink-muted)]">
          {["Invoice is generated when you continue", "Same-currency account credit is applied automatically", "No real payment is processed in this demo"].map((item) => <p key={item} className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-[var(--color-positive)]" />{item}</p>)}
        </div>
      </div>
    </GlassPanel>
  );
}

