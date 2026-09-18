import {
  CheckCircle2,
  CreditCard,
  Loader2,
  XCircle,
} from "lucide-react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { paymentsApi } from "../../api/payments";
import { StatusBadge } from "../../components/status-badge";
import { ErrorState } from "../../components/error-state";
import { SectionCard } from "../../components/section-card";

function money(
  amount: number,
  currency: string,
) {
  const symbol =
    currency === "INR"
      ? "₹"
      : "$";

  return `${symbol}${(
    amount / 100
  ).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function date(value: string) {
  return new Date(value).toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  );
}

export function CustomerBillingHistoryPage() {
  const { businessId } =
    useParams<{
      businessId: string;
    }>();

  const query = useQuery({
    queryKey: [
      "payments",
      businessId,
    ],
    queryFn: () =>
      paymentsApi.list(
        businessId!,
      ),
    enabled: Boolean(businessId),
  });

  if (!businessId) {
    return (
      <ErrorState
        description="A valid business context is required."
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

  if (query.isError) {
    return (
      <ErrorState
        description="We couldn't load your billing history."
        retryAction={() => query.refetch()}
      />
    );
  }

  const payments =
    query.data ?? [];

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">
          Activity
        </p>

        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-gray-900">
          Billing history
        </h1>

        <p className="mt-2 text-sm text-gray-500">
          A record of payment attempts made through
          your account.
        </p>
      </header>

      <SectionCard
        title="Payment activity"
        description="Successful and failed payment attempts."
      >
        {payments.length === 0 ? (
          <div className="py-12 text-center">
            <CreditCard className="mx-auto h-10 w-10 text-gray-300" />

            <h3 className="mt-4 font-semibold">
              No payment activity
            </h3>

            <p className="mt-2 text-sm text-gray-500">
              Payment attempts will appear here after
              billing activity.
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {payments.map(
              (payment) => (
                <div
                  key={payment.id}
                  className="flex flex-col gap-4 rounded-xl border border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-50">
                      {payment.status ===
                      "SUCCESS" ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="font-medium">
                          Payment attempt
                        </p>

                        <StatusBadge
                          status={
                            payment.status
                          }
                        />
                      </div>

                      <p className="mt-1 text-xs text-gray-400">
                        {date(
                          payment.createdAt,
                        )}{" "}
                        ·{" "}
                        {payment.paymentMethod}
                      </p>
                    </div>
                  </div>

                  <div className="sm:text-right">
                    <p className="font-semibold">
                      {money(
                        payment.amount,
                        payment.currency,
                      )}
                    </p>

                    <p className="mt-1 font-mono text-[11px] text-gray-400">
                      {payment.invoiceId}
                    </p>
                  </div>
                </div>
              ),
            )}
          </div>
        )}
      </SectionCard>
    </div>
  );
}