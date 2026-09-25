import { useState } from "react";
import {
  Mail,
  Plus,
  Search,
  Users,
  X,
} from "lucide-react";
import {
  useMutation,
  useQuery,
} from "@tanstack/react-query";
import {
  Link,
  useParams,
} from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";

import { adminApi } from "../../api/admin";
import { Button } from "../../components/ui/button";
import { LoadingState } from "../../components/loading-state";
import { ErrorState } from "../../components/error-state";
import { queryClient } from "../../lib/query-client";

function date(value: string) {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function AdminCustomersPage() {
  const { businessId } =
    useParams<{ businessId: string }>();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [showAddCustomer, setShowAddCustomer] =
    useState(false);
  const [email, setEmail] = useState("");

  const query = useQuery({
    queryKey: [
      "admin-customers",
      businessId,
      page,
    ],
    queryFn: () =>
      adminApi.customers(
        businessId!,
        page,
      ),
    enabled: Boolean(businessId),
  });

  const addCustomerMutation = useMutation({
    mutationFn: () =>
      adminApi.addCustomer(
        businessId!,
        email.trim(),
      ),

    onSuccess: async () => {
      setEmail("");
      setShowAddCustomer(false);

      await queryClient.invalidateQueries({
        queryKey: [
          "admin-customers",
          businessId,
        ],
      });

      toast.success(
        "Customer added to this business.",
      );
    },

    onError: (error) => {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.error?.message
        : undefined;

      toast.error(
        message ??
          "Unable to add customer.",
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
      <LoadingState message="Loading customers..." />
    );
  }

  if (query.isError) {
    return (
      <ErrorState
        description="We couldn't load the customers."
        retryAction={() => query.refetch()}
      />
    );
  }

  const customers = query.data?.data ?? [];

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.user.email
        .toLowerCase()
        .includes(search.trim().toLowerCase()),
  );

  const pagination = query.data?.pagination;

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">
            Customers
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-gray-900">
            Customers
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-gray-500">
            Customers associated with this business
            and their billing activity.
          </p>
        </div>

        <Button
          onClick={() =>
            setShowAddCustomer(true)
          }
        >
          <Plus className="mr-2 h-4 w-4" />
          Add customer
        </Button>
      </header>

      {showAddCustomer && (
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-semibold text-gray-900">
                Add existing customer
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Enter the email address of a registered
                Customer account.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowAddCustomer(false);
                setEmail("");
              }}
              className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

              <input
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="customer@example.com"
                disabled={
                  addCustomerMutation.isPending
                }
                className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:bg-gray-50"
              />
            </div>

            <Button
              disabled={
                !email.trim() ||
                addCustomerMutation.isPending
              }
              onClick={() =>
                addCustomerMutation.mutate()
              }
            >
              {addCustomerMutation.isPending
                ? "Adding..."
                : "Add customer"}
            </Button>
          </div>

          <p className="mt-3 text-xs text-gray-400">
            This does not create a new account. The
            customer must already have a CUSTOMER account.
          </p>
        </section>
      )}

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-gray-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">
              Customer directory
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {customers.length} customers on this page
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search email..."
              className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-3 text-sm outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
            />
          </div>
        </div>

        {filteredCustomers.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <Users className="mx-auto h-10 w-10 text-gray-300" />

            <p className="mt-4 font-semibold text-gray-900">
              {customers.length === 0
                ? "No customers yet"
                : "No matching customers"}
            </p>

            <p className="mt-1 text-sm text-gray-500">
              {customers.length === 0
                ? "Add a registered customer to this business to get started."
                : "Try a different email search."}
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {filteredCustomers.map(
              (customer) => (
                <Link
                  key={customer.id}
                  to={`/admin/${businessId}/customers/${customer.id}`}
                  className="block px-6 py-5 transition hover:bg-gray-50"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-sm font-semibold text-indigo-700">
                        {customer.user.email
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate font-medium text-gray-900">
                          {customer.user.email}
                        </p>

                        <p className="mt-1 text-xs text-gray-400">
                          Customer since{" "}
                          {date(
                            customer.createdAt,
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-6 text-sm">
                      <Stat
                        label="Subscriptions"
                        value={
                          customer._count
                            .subscriptions
                        }
                      />

                      <Stat
                        label="Invoices"
                        value={
                          customer._count
                            .invoices
                        }
                      />

                      <Stat
                        label="Credits"
                        value={
                          customer._count
                            .creditLedger
                        }
                      />
                    </div>
                  </div>
                </Link>
              ),
            )}
          </div>
        )}

        {pagination &&
        (pagination.hasNextPage || page > 1) ? (
          <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4">
            <button
              type="button"
              disabled={page === 1}
              onClick={() =>
                setPage((value) =>
                  value - 1,
                )
              }
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>

            <span className="text-sm text-gray-500">
              Page {page}
            </span>

            <button
              type="button"
              disabled={!pagination.hasNextPage}
              onClick={() =>
                setPage((value) =>
                  value + 1,
                )
              }
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        ) : null}
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="text-right">
      <p className="text-xs text-gray-400">
        {label}
      </p>

      <p className="mt-1 font-semibold tabular-nums text-gray-900">
        {value}
      </p>
    </div>
  );
}