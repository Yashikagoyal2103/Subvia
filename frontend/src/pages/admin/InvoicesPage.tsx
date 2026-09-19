import { FileText } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "../../api/admin";
import { LoadingState } from "../../components/loading-state";
import { ErrorState } from "../../components/error-state";
import { StatusBadge } from "../../components/status-badge";

const currencySymbol: Record<string, string> = { INR: "₹", USD: "$" };

function money(amount: number, currency: string) {
  return `${currencySymbol[currency] ?? currency}${(amount / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function date(value: string) {
  return new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function AdminInvoicesPage() {
  const { businessId } = useParams<{ businessId: string }>();
  const query = useQuery({ queryKey: ["admin-invoices", businessId], queryFn: () => adminApi.invoices(businessId!), enabled: Boolean(businessId) });

  if (!businessId) return <ErrorState description="A valid business context is required." />;
  if (query.isLoading) return <LoadingState message="Loading invoices..." />;
  if (query.isError) return <ErrorState description="We couldn't load the invoices." retryAction={() => query.refetch()} />;

  const invoices = query.data?.data ?? [];

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">Billing</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-gray-900">Invoices</h1>
        <p className="mt-2 text-sm text-gray-500">Business-wide billing documents and their payment state.</p>
      </header>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-6 py-5">
          <h2 className="font-semibold text-gray-900">Invoice history</h2>
          <p className="mt-1 text-sm text-gray-500">{invoices.length} invoices on this page</p>
        </div>

        {invoices.length === 0 ? (
          <div className="py-16 text-center">
            <FileText className="mx-auto h-10 w-10 text-gray-300" />
            <p className="mt-4 font-semibold">No invoices yet</p>
            <p className="mt-1 text-sm text-gray-500">Invoices will appear after subscription billing.</p>
          </div>
        ) : (
          <div className="divide-y">
            {invoices.map((invoice) => (
              <Link
                key={invoice.id}
                to={`/admin/${businessId}/invoices/${invoice.id}`}
                className="block px-6 py-5 transition hover:bg-gray-50"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900">{invoice.invoiceNumber}</p>
                      <p className="mt-1 truncate text-sm text-gray-500">
                        {invoice.customerProfile.user.email} · {invoice.subscription?.plan.service.name ?? "Subscription"}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-6">
                    <div>
                      <p className="text-xs text-gray-400">Issued</p>
                      <p className="mt-1 text-sm font-medium">{date(invoice.issuedAt)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Total</p>
                      <p className="mt-1 font-semibold">{money(invoice.total, invoice.currency)}</p>
                    </div>
                    <StatusBadge status={invoice.status} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}