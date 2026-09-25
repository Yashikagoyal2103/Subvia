import { useEffect, useState } from "react";
import {
  Building2,
  CheckCircle2,
  Save,
  User,
} from "lucide-react";
import {
  useMutation,
  useQuery,
} from "@tanstack/react-query";
import {
  useParams,
} from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";

import { businessesApi } from "../../api/businesses";
import { useAuthStore } from "../../stores/auth.store";
import { LoadingState } from "../../components/loading-state";
import { ErrorState } from "../../components/error-state";
import { Button } from "../../components/ui/button";
import { queryClient } from "../../lib/query-client";

export function AdminSettingsPage() {
  const { businessId } =
    useParams<{ businessId: string }>();

  const user = useAuthStore(
    (state) => state.user,
  );

  const [name, setName] = useState("");
  const [taxRate, setTaxRate] =
    useState("");

  const query = useQuery({
    queryKey: [
      "admin-business",
      businessId,
    ],
    queryFn: () =>
      businessesApi.getById(
        businessId!,
      ),
    enabled: Boolean(businessId),
  });

  useEffect(() => {
    if (!query.data) {
      return;
    }

    setName(query.data.name);
    setTaxRate(
      String(query.data.taxRate),
    );
  }, [query.data]);

  const updateMutation = useMutation({
    mutationFn: () =>
      businessesApi.update(
        businessId!,
        {
          name: name.trim(),
          taxRate: Number(taxRate),
        },
      ),

    onSuccess: async (business) => {
      setName(business.name);
      setTaxRate(
        String(business.taxRate),
      );

      await queryClient.invalidateQueries({
        queryKey: [
          "admin-business",
          businessId,
        ],
      });

      await queryClient.invalidateQueries({
        queryKey: ["admin-businesses"],
      });

      toast.success(
        "Business settings updated.",
      );
    },

    onError: (error) => {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.error?.message
        : undefined;

      toast.error(
        message ??
          "Unable to update business settings.",
      );
    },
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
      <LoadingState message="Loading business settings..." />
    );
  }

  if (query.isError || !query.data) {
    return (
      <ErrorState
        description="We couldn't load the business settings."
        retryAction={() =>
          query.refetch()
        }
      />
    );
  }

  const saveDisabled =
    !name.trim() ||
    Number.isNaN(Number(taxRate)) ||
    Number(taxRate) < 0 ||
    Number(taxRate) > 100 ||
    updateMutation.isPending;

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">
          Administration
        </p>

        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-gray-900">
          Settings
        </h1>

        <p className="mt-2 max-w-2xl text-sm text-gray-500">
          Manage the business information used
          throughout your billing workspace.
        </p>
      </header>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <Building2 className="h-5 w-5" />
          </div>

          <div>
            <h2 className="font-semibold text-gray-900">
              Business profile
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              These details identify the current
              billing business.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-gray-700">
              Business name
            </span>

            <input
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              disabled={
                updateMutation.isPending
              }
              className="mt-2 h-11 w-full rounded-xl border border-gray-200 bg-white px-3.5 text-sm text-gray-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:bg-gray-50"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-gray-700">
              Tax rate
            </span>

            <div className="relative mt-2">
              <input
                type="number"
                min={0}
                max={100}
                step={1}
                value={taxRate}
                onChange={(event) =>
                  setTaxRate(
                    event.target.value,
                  )
                }
                disabled={
                  updateMutation.isPending
                }
                className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3.5 pr-10 text-sm text-gray-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:bg-gray-50"
              />

              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                %
              </span>
            </div>

            <p className="mt-2 text-xs text-gray-400">
              Applied to invoices generated for this
              business.
            </p>
          </label>
        </div>

        <div className="mt-6 flex justify-end border-t border-gray-100 pt-5">
          <Button
            disabled={saveDisabled}
            onClick={() =>
              updateMutation.mutate()
            }
          >
            <Save className="mr-2 h-4 w-4" />

            {updateMutation.isPending
              ? "Saving..."
              : "Save changes"}
          </Button>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <User className="h-5 w-5" />
          </div>

          <div>
            <h2 className="font-semibold text-gray-900">
              Your account
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              The account currently managing this
              business.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Info
            label="Name"
            value={
              [user?.firstName, user?.lastName]
                .filter(Boolean)
                .join(" ") || "—"
            }
          />

          <Info
            label="Email"
            value={user?.email ?? "—"}
          />

          <Info
            label="Account type"
            value={
              user?.accountType ??
              "ADMIN"
            }
          />

          <Info
            label="Business"
            value={query.data.name}
          />
        </div>

        <div className="mt-5 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>
            You are an administrator of this
            business.
          </span>
        </div>
      </section>
    </div>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-gray-50 p-4">
      <p className="text-xs text-gray-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-medium text-gray-900">
        {value}
      </p>
    </div>
  );
}