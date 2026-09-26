import { useEffect, useState } from "react";
import { Building2, Save, User } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";

import { businessesApi } from "../../api/businesses";
import { useAuthStore } from "../../stores/auth.store";
import { Button } from "../../components/ui/button";
import { queryClient } from "../../lib/query-client";
import { useCurrentBusinessName } from "@/hooks/useCurrentBusinessName";

import { AdminCard } from "@/components/admin/AdminCard";
import { AdminErrorState } from "@/components/admin/AdminErrorState";
import { AdminLoadingState } from "@/components/admin/AdminLoadingState";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { IconBadge } from "@/components/admin/IconBadge";
import { InsightBanner } from "@/components/admin/InsightBanner";

export function AdminSettingsPage() {
  const { businessId } = useParams<{ businessId: string }>();
  const businessName = useCurrentBusinessName();
  const user = useAuthStore((s) => s.user);

  const [name, setName] = useState("");
  const [taxRate, setTaxRate] = useState("");

  const query = useQuery({
    queryKey: ["admin-business", businessId],
    queryFn: () => businessesApi.getById(businessId!),
    enabled: Boolean(businessId),
  });

  useEffect(() => {
    if (!query.data) return;
    setName(query.data.name);
    setTaxRate(String(query.data.taxRate));
  }, [query.data]);

  const updateMutation = useMutation({
    mutationFn: () =>
      businessesApi.update(businessId!, {
        name: name.trim(),
        taxRate: Number(taxRate),
      }),
    onSuccess: async (business) => {
      setName(business.name);
      setTaxRate(String(business.taxRate));
      await queryClient.invalidateQueries({
        queryKey: ["admin-business", businessId],
      });
      await queryClient.invalidateQueries({
        queryKey: ["admin-businesses"],
      });
      toast.success("Business settings updated.");
    },
    onError: (error) => {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.error?.message
        : undefined;
      toast.error(message ?? "Unable to update business settings.");
    },
  });

  if (!businessId) {
    return <AdminErrorState message="A valid business context is required." />;
  }
  if (query.isLoading) return <AdminLoadingState variant="detail" />;
  if (query.isError || !query.data) {
    return (
      <AdminErrorState
        message="We couldn't load the business settings."
        onRetry={() => query.refetch()}
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
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow={businessName ? `${businessName} / Settings` : "Admin / Settings"}
        title="Settings"
        description="Manage the business information used throughout your billing workspace."
      />

      <AdminCard>
        <div className="flex items-start gap-4 border-b border-[var(--a-border)] pb-5">
          <IconBadge
            icon={<Building2 className="h-4 w-4" />}
            tone="indigo"
            size="md"
          />
          <div>
            <h2 className="text-sm font-semibold text-[var(--a-ink)]">
              Business profile
            </h2>
            <p className="mt-0.5 text-xs text-[var(--a-ink-2)]">
              These details identify the current billing business.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-semibold text-[var(--a-ink)]">
              Business name
            </span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={updateMutation.isPending}
              className="mt-2 h-11 w-full rounded-xl border border-[var(--a-border)] px-3.5 text-sm outline-none transition focus:border-[var(--a-indigo)] disabled:bg-[var(--a-canvas-2)]"
            />
          </label>

          <label className="block">
            <span className="text-xs font-semibold text-[var(--a-ink)]">
              Tax rate
            </span>
            <div className="relative mt-2">
              <input
                type="number"
                min={0}
                max={100}
                step={1}
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                disabled={updateMutation.isPending}
                className="h-11 w-full rounded-xl border border-[var(--a-border)] px-3.5 pr-10 text-sm outline-none transition focus:border-[var(--a-indigo)] disabled:bg-[var(--a-canvas-2)]"
              />
              <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-[var(--a-ink-3)]">
                %
              </span>
            </div>
            <p className="mt-2 text-xs text-[var(--a-ink-3)]">
              Applied to invoices generated for this business.
            </p>
          </label>
        </div>

        <div className="mt-6 flex justify-end border-t border-[var(--a-border)] pt-5">
          <Button
            disabled={saveDisabled}
            onClick={() => updateMutation.mutate()}
          >
            <Save className="mr-2 h-4 w-4" />
            {updateMutation.isPending ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </AdminCard>

      <AdminCard>
        <div className="flex items-start gap-4 border-b border-[var(--a-border)] pb-5">
          <IconBadge
            icon={<User className="h-4 w-4" />}
            tone="emerald"
            size="md"
          />
          <div>
            <h2 className="text-sm font-semibold text-[var(--a-ink)]">
              Your account
            </h2>
            <p className="mt-0.5 text-xs text-[var(--a-ink-2)]">
              The account currently managing this business.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Info
            label="Name"
            value={
              [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "—"
            }
          />
          <Info label="Email" value={user?.email ?? "—"} />
          <Info label="Account type" value={user?.accountType ?? "ADMIN"} />
          <Info label="Business" value={query.data.name} />
        </div>

        <div className="mt-5">
          <InsightBanner tone="positive">
            You are an administrator of this business.
          </InsightBanner>
        </div>
      </AdminCard>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[var(--a-canvas-2)] p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--a-ink-3)]">
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-medium text-[var(--a-ink)]">
        {value}
      </p>
    </div>
  );
}