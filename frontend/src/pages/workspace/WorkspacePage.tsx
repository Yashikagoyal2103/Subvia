import { useState } from "react";
import {
  Building2,
  ChevronRight,
  Loader2,
  Plus,
  ShieldCheck,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";

import { businessesApi } from "../../api/businesses";
import { Button } from "../../components/ui/button";
import { queryClient } from "../../lib/query-client";

export function WorkspacePage() {
  const [name, setName] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const query = useQuery({
    queryKey: ["my-businesses"],
    queryFn: businessesApi.getMine,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      businessesApi.create({
        name: name.trim(),
      }),
    onSuccess: async () => {
      setName("");
      setShowCreate(false);
      await queryClient.invalidateQueries({
        queryKey: ["my-businesses"],
      });
      toast.success("Business created.");
    },
    onError: (error) => {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.error?.message
        : undefined;

      toast.error(
        message ?? "Unable to create business.",
      );
    },
  });

  if (query.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (query.isError) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-gray-900">
            Unable to load your workspace
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Please refresh and try again.
          </p>
        </div>
      </div>
    );
  }

  const businesses = query.data ?? [];

  return (
    <div className="min-h-screen bg-[#f7f8fc] px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">
            Workspace
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-gray-950">
            Choose your business
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Select a business to open its billing workspace.
          </p>
        </header>

        {businesses.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Building2 className="h-6 w-6" />
            </div>

            <h2 className="mt-5 text-lg font-semibold text-gray-900">
              Create your first business
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
              Your business is the tenant that owns services,
              plans, customers and billing data.
            </p>

            {!showCreate ? (
              <Button
                className="mt-6"
                onClick={() => setShowCreate(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create business
              </Button>
            ) : (
              <div className="mx-auto mt-6 flex max-w-md flex-col gap-3 sm:flex-row">
                <input
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  placeholder="Acme Cloud"
                  className="h-10 flex-1 rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />

                <Button
                  disabled={
                    !name.trim() ||
                    createMutation.isPending
                  }
                  onClick={() =>
                    createMutation.mutate()
                  }
                >
                  {createMutation.isPending
                    ? "Creating..."
                    : "Create"}
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {businesses.map((business) => (
              <div
                key={business.id}
                className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                      <Building2 className="h-5 w-5" />
                    </div>

                    <div>
                      <h2 className="font-semibold text-gray-900">
                        {business.name}
                      </h2>

                      <p className="mt-1 text-xs text-gray-500">
                        Tax rate: {business.taxRate}%
                      </p>
                    </div>
                  </div>

                  <ShieldCheck className="h-5 w-5 text-emerald-500" />
                </div>

                <div className="mt-6 grid gap-2 sm:grid-cols-2">
                  <Link
                    to={`/admin/${business.id}/dashboard`}
                    className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 transition hover:border-indigo-200 hover:bg-indigo-50/50 hover:text-indigo-700"
                  >
                    Admin workspace
                    <ChevronRight className="h-4 w-4" />
                  </Link>

                  <Link
                    to={`/customer/${business.id}/dashboard`}
                    className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 transition hover:border-indigo-200 hover:bg-indigo-50/50 hover:text-indigo-700"
                  >
                    Customer view
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {businesses.length > 0 && (
          <div className="mt-6">
            <Button
              variant="outline"
              onClick={() => setShowCreate(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add another business
            </Button>

            {showCreate && (
              <div className="mt-4 flex max-w-lg gap-3">
                <input
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  placeholder="Business name"
                  className="h-10 flex-1 rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />

                <Button
                  disabled={
                    !name.trim() ||
                    createMutation.isPending
                  }
                  onClick={() =>
                    createMutation.mutate()
                  }
                >
                  {createMutation.isPending
                    ? "Creating..."
                    : "Create"}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}