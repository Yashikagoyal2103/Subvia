import {
  Coins,
  Info,
  Loader2,
  Wallet,
} from "lucide-react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { creditsApi } from "../../api/credits";
import { ErrorState } from "../../components/error-state";
import { SectionCard } from "../../components/section-card";

export function CustomerCreditsPage() {
  const { businessId } =
    useParams<{
      businessId: string;
    }>();

  const query = useQuery({
    queryKey: [
      "credit-balance",
      businessId,
    ],
    queryFn: () =>
      creditsApi.getBalance(
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
        description="We couldn't load your credit balance."
        retryAction={() => query.refetch()}
      />
    );
  }

  const balance =
    query.data ?? {
      INR: 0,
      USD: 0,
    };

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">
          Account
        </p>

        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-gray-900">
          Credits
        </h1>

        <p className="mt-2 text-sm text-gray-500">
          Available billing credit that can reduce
          eligible future invoices.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="relative overflow-hidden rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white p-7 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-sm">
              <Wallet className="h-5 w-5 text-indigo-600" />
            </div>

            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-500">
              INR
            </span>
          </div>

          <p className="mt-8 text-sm text-gray-500">
            Available balance
          </p>

          <p className="mt-2 text-4xl font-bold tracking-tight text-gray-900">
            ₹{(
              balance.INR / 100
            ).toLocaleString("en-IN", {
              minimumFractionDigits: 2,
            })}
          </p>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-purple-100 bg-gradient-to-br from-purple-50 to-white p-7 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-sm">
              <Coins className="h-5 w-5 text-purple-600" />
            </div>

            <span className="text-xs font-semibold uppercase tracking-wider text-purple-500">
              USD
            </span>
          </div>

          <p className="mt-8 text-sm text-gray-500">
            Available balance
          </p>

          <p className="mt-2 text-4xl font-bold tracking-tight text-gray-900">
            ${(
              balance.USD / 100
            ).toLocaleString("en-US", {
              minimumFractionDigits: 2,
            })}
          </p>
        </div>
      </div>

      <SectionCard
        title="How credits work"
        description="Credits are part of the billing ledger."
      >
        <div className="flex gap-4 rounded-xl bg-gray-50 p-5">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-indigo-500" />

          <div className="space-y-2 text-sm text-gray-600">
            <p>
              Credits can be applied to eligible future
              invoices.
            </p>

            <p>
              They are tracked in the billing ledger and
              are not withdrawable or transferable.
            </p>

            <p>
              INR and USD balances are kept separately;
              the platform does not silently convert
              currencies.
            </p>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}