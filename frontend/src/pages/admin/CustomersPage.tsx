import { useState } from "react";
import { Mail, Plus, Search, Users, X } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";

import { adminApi } from "../../api/admin";
import { Button } from "../../components/ui/button";
import { queryClient } from "../../lib/query-client";
import { useCurrentBusinessName } from "@/hooks/useCurrentBusinessName";

import { AdminCard } from "@/components/admin/AdminCard";
import { AdminErrorState } from "@/components/admin/AdminErrorState";
import { AdminLoadingState } from "@/components/admin/AdminLoadingState";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ListRow } from "@/components/admin/ListRow";

function date(value: string) {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function AdminCustomersPage() {
  const { businessId } = useParams<{ businessId: string }>();
  const businessName = useCurrentBusinessName();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [email, setEmail] = useState("");

  const query = useQuery({
    queryKey: ["admin-customers", businessId, page],
    queryFn: () => adminApi.customers(businessId!, page),
    enabled: Boolean(businessId),
  });

  const addCustomerMutation = useMutation({
    mutationFn: () => adminApi.addCustomer(businessId!, email.trim()),
    onSuccess: async () => {
      setEmail("");
      setShowAddCustomer(false);
      await queryClient.invalidateQueries({
        queryKey: ["admin-customers", businessId],
      });
      toast.success("Customer added to this business.");
    },
    onError: (error) => {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.error?.message
        : undefined;
      toast.error(message ?? "Unable to add customer.");
    },
  });

  if (!businessId) {
    return <AdminErrorState message="A valid business context is required." />;
  }
  if (query.isLoading) return <AdminLoadingState variant="list" rows={6} />;
  if (query.isError) {
    return (
      <AdminErrorState
        message="We couldn't load the customers."
        onRetry={() => query.refetch()}
      />
    );
  }

  const customers = query.data?.data ?? [];
  const filtered = customers.filter((c) =>
    c.user.email.toLowerCase().includes(search.trim().toLowerCase()),
  );
  const pagination = query.data?.pagination;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow={
          businessName ? `${businessName} / Customers` : "Admin / Customers"
        }
        title="Customers"
        description="Customers associated with this business and their billing activity."
        actions={
          <Button onClick={() => setShowAddCustomer(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add customer
          </Button>
        }
      />

      {showAddCustomer ? (
        <AdminCard>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-[var(--a-ink)]">
                Add existing customer
              </h2>
              <p className="mt-1 text-xs text-[var(--a-ink-2)]">
                Enter the email of a registered Customer account.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setShowAddCustomer(false);
                setEmail("");
              }}
              className="rounded-lg p-2 text-[var(--a-ink-3)] transition hover:bg-[rgba(15,15,10,0.04)]"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--a-ink-3)]" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="customer@example.com"
                disabled={addCustomerMutation.isPending}
                className="h-11 w-full rounded-xl border border-[var(--a-border)] bg-white pl-10 pr-3 text-sm text-[var(--a-ink)] outline-none transition focus:border-[var(--a-indigo)] disabled:bg-[var(--a-canvas-2)]"
              />
            </div>
            <Button
              disabled={!email.trim() || addCustomerMutation.isPending}
              onClick={() => addCustomerMutation.mutate()}
            >
              {addCustomerMutation.isPending ? "Adding…" : "Add customer"}
            </Button>
          </div>

          <p className="mt-3 text-xs text-[var(--a-ink-3)]">
            This does not create a new account. The customer must already have
            a Customer account.
          </p>
        </AdminCard>
      ) : null}

      <AdminCard variant="flush">
        <div className="flex flex-col gap-4 border-b border-[var(--a-border)] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-[var(--a-ink)]">
              Customer directory
            </h2>
            <p className="mt-0.5 text-xs text-[var(--a-ink-3)]">
              {customers.length} customer{customers.length === 1 ? "" : "s"} on
              this page
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--a-ink-3)]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search email…"
              className="h-10 w-full rounded-xl border border-[var(--a-border)] bg-[var(--a-canvas-2)] pl-9 pr-3 text-sm outline-none transition focus:border-[var(--a-indigo)] focus:bg-white"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <Users className="mx-auto h-8 w-8 text-[var(--a-ink-3)]" />
            <p className="mt-3 text-sm font-semibold text-[var(--a-ink)]">
              {customers.length === 0
                ? "No customers yet"
                : "No matching customers"}
            </p>
            <p className="mt-1 text-sm text-[var(--a-ink-2)]">
              {customers.length === 0
                ? "Add a registered customer to this business to get started."
                : "Try a different email search."}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-[var(--a-border)] px-4 py-2">
            {filtered.map((customer) => (
              <li key={customer.id}>
                <ListRow
                  icon={
                    <span className="text-xs font-bold">
                      {customer.user.email.charAt(0).toUpperCase()}
                    </span>
                  }
                  leadingBadgeTone="indigo"
                  title={customer.user.email}
                  subtitle={`Customer since ${date(customer.createdAt)}`}
                  trailing={
                    <>
                      <Chip label="Subs" value={customer._count.subscriptions} />
                      <Chip label="Invoices" value={customer._count.invoices} />
                      <Chip label="Credits" value={customer._count.creditLedger} />
                    </>
                  }
                  href={`/admin/${businessId}/customers/${customer.id}`}
                />
              </li>
            ))}
          </ul>
        )}

        {pagination && (pagination.hasNextPage || page > 1) ? (
          <div className="flex items-center justify-between border-t border-[var(--a-border)] px-6 py-4">
            <button
              type="button"
              disabled={page === 1}
              onClick={() => setPage((v) => v - 1)}
              className="rounded-full border border-[var(--a-border)] bg-white px-3 py-2 text-xs font-semibold text-[var(--a-ink)] transition hover:border-[var(--a-border-strong)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-xs text-[var(--a-ink-3)]">Page {page}</span>
            <button
              type="button"
              disabled={!pagination.hasNextPage}
              onClick={() => setPage((v) => v + 1)}
              className="rounded-full border border-[var(--a-border)] bg-white px-3 py-2 text-xs font-semibold text-[var(--a-ink)] transition hover:border-[var(--a-border-strong)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        ) : null}
      </AdminCard>
    </div>
  );
}

function Chip({ label, value }: { label: string; value: number }) {
  return (
    <span className="hidden items-center gap-1.5 rounded-full bg-[var(--a-canvas-2)] px-2.5 py-1 text-[11px] font-semibold text-[var(--a-ink-2)] sm:inline-flex">
      <span className="text-[var(--a-ink-3)]">{label}</span>
      <span className="tabular-nums text-[var(--a-ink)]">{value}</span>
    </span>
  );
}
