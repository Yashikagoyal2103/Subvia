import { CheckCircle2, FileText, IndianRupee, Loader2, Receipt } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { invoicesApi, type Invoice } from "../../api/invoices";
import { StatusBadge } from "../../components/status-badge";
import { ErrorState } from "../../components/error-state";
import { SectionCard } from "../../components/section-card";

const currencySymbol: Record<string, string> = { INR: "₹", USD: "$" };

function formatMoney(amount: number, currency: string) {
  return `${currencySymbol[currency] ?? currency}${(amount / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function CustomerInvoicesPage() {
  const { businessId } = useParams<{ businessId: string }>();

  const query = useQuery({
    queryKey: ["invoices", businessId],
    queryFn: () => invoicesApi.list(businessId!),
    enabled: Boolean(businessId),
  });

  if (!businessId) return <ErrorState description="A valid business context is required." />;

  if (query.isLoading) {
    return <div className="flex min-h-[400px] items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-indigo-600" /></div>;
  }

  if (query.isError) {
    return <ErrorState description="We couldn't load your invoices." retryAction={() => query.refetch()} />;
  }

  const invoices: Invoice[] = query.data?.data ?? [];
  const paidInvoices: Invoice[] = invoices.filter((invoice: Invoice) => invoice.status === "PAID");
  const openInvoices: Invoice[] = invoices.filter((invoice: Invoice) => invoice.status === "OPEN");
  const outstandingAmount = openInvoices.reduce((total: number, invoice: Invoice) => total + invoice.total, 0);

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">Billing</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-gray-900">Invoices</h1>
        <p className="mt-2 text-sm text-gray-500">View your billing documents and payment status.</p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between"><p className="text-sm text-gray-500">Total invoices</p><Receipt className="h-5 w-5 text-indigo-500" /></div>
          <p className="mt-3 text-3xl font-semibold">{invoices.length}</p>
          <p className="mt-1 text-xs text-gray-400">Billing records</p>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between"><p className="text-sm text-gray-500">Paid</p><CheckCircle2 className="h-5 w-5 text-emerald-500" /></div>
          <p className="mt-3 text-3xl font-semibold">{paidInvoices.length}</p>
          <p className="mt-1 text-xs text-gray-400">Successfully settled</p>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between"><p className="text-sm text-gray-500">Outstanding</p><IndianRupee className="h-5 w-5 text-amber-500" /></div>
          <p className="mt-3 text-3xl font-semibold">{openInvoices.length > 0 ? formatMoney(outstandingAmount, openInvoices[0].currency) : "₹0.00"}</p>
          <p className="mt-1 text-xs text-gray-400">Open invoice balance</p>
        </div>
      </div>

      <SectionCard title="Invoice history" description="Your latest billing records.">
        {invoices.length === 0 ? (
          <div className="py-12 text-center">
            <FileText className="mx-auto h-10 w-10 text-gray-300" />
            <h3 className="mt-4 font-semibold text-gray-900">No invoices yet</h3>
            <p className="mt-2 text-sm text-gray-500">Your invoices will appear here after billing activity.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {invoices.map((invoice: Invoice) => (
              <Link key={invoice.id} to={`/customer/${businessId}/invoices/${invoice.id}`} className="flex flex-col gap-4 py-5 transition hover:bg-gray-50 sm:flex-row sm:items-center sm:justify-between sm:px-3">
                <div className="flex min-w-0 items-center gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"><FileText className="h-5 w-5" /></div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900">{invoice.invoiceNumber}</p>
                    <p className="mt-1 text-xs text-gray-400">{formatDate(invoice.issuedAt)}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-5 sm:justify-end">
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{formatMoney(invoice.total, invoice.currency)}</p>
                    <p className="mt-1 text-xs text-gray-400">{invoice.currency}</p>
                  </div>
                  <StatusBadge status={invoice.status} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}