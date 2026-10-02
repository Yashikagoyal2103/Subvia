import { useState } from "react";
import { Copy, KeyRound, Loader2, Plus, ShieldAlert, Trash2 } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";

import { apiKeysApi, type ApiKey } from "../../api/api-keys";
import { Button } from "../../components/ui/button";
import { queryClient } from "../../lib/query-client";
import { useCurrentBusinessName } from "@/hooks/useCurrentBusinessName";

import { AdminCard } from "@/components/admin/AdminCard";
import { AdminErrorState } from "@/components/admin/AdminErrorState";
import { AdminLoadingState } from "@/components/admin/AdminLoadingState";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ConfirmActionDialog } from "@/components/admin/ConfirmActionDialog";
import { ListRow } from "@/components/admin/ListRow";
import { StatusBadge } from "@/components/status-badge";

function date(value: string | null) {
  if (!value) return "Never";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function AdminApiKeysPage() {
  const { businessId } = useParams<{ businessId: string }>();
  const businessName = useCurrentBusinessName();

  const [name, setName] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [confirmKey, setConfirmKey] = useState<ApiKey | null>(null);

  const query = useQuery({
    queryKey: ["api-keys", businessId],
    queryFn: () => apiKeysApi.list(businessId!),
    enabled: Boolean(businessId),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      apiKeysApi.create(businessId!, {
        name: name.trim(),
        ...(expiresAt ? { expiresAt } : {}),
      }),
    onSuccess: async (result) => {
      setName("");
      setExpiresAt("");
      setShowCreate(false);
      setCreatedKey(result.key);
      await queryClient.invalidateQueries({
        queryKey: ["api-keys", businessId],
      });
      toast.success("API key created.");
    },
    onError: (error) => {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.error?.message
        : undefined;
      toast.error(message ?? "Unable to create API key.");
    },
  });

  const revokeMutation = useMutation({
    mutationFn: (id: string) => apiKeysApi.revoke(businessId!, id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["api-keys", businessId],
      });
      toast.success("API key revoked.");
      setConfirmKey(null);
    },
  });

  if (!businessId) {
    return <AdminErrorState message="A valid business context is required." />;
  }
  if (query.isLoading) return <AdminLoadingState variant="list" rows={4} />;
  if (query.isError) {
    return (
      <AdminErrorState
        message="We couldn't load API keys."
        onRetry={() => query.refetch()}
      />
    );
  }

  const keys = query.data ?? [];

  const copyKey = async () => {
    if (!createdKey) return;
    await navigator.clipboard.writeText(createdKey);
    toast.success("API key copied.");
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow={businessName ? `${businessName} / API Keys` : "Admin / API Keys"}
        title="API keys"
        description="Give external applications authenticated access to your public catalog API."
        actions={
          <Button
            onClick={() => {
              setShowCreate(true);
              setCreatedKey(null);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create API key
          </Button>
        }
      />

      {createdKey ? (
        <div className="rounded-2xl border border-[var(--a-amber)]/30 bg-[var(--a-amber-soft)] px-5 py-4">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-0.5 h-5 w-5 text-[var(--a-amber)]" />
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-semibold text-[#7c540f]">
                Save this API key
              </h2>
              <p className="mt-1 text-xs text-[#7c540f]/80">
                Store this key securely — it will not be shown again.
              </p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <code className="min-w-0 flex-1 overflow-x-auto rounded-lg border border-[var(--a-amber)]/30 bg-white px-3 py-2 font-mono text-xs text-[var(--a-ink)]">
                  {createdKey}
                </code>
                <Button variant="outline" onClick={copyKey}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {showCreate ? (
        <AdminCard>
          <h2 className="text-sm font-semibold text-[var(--a-ink)]">
            Create API key
          </h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-semibold text-[var(--a-ink)]">
                Name
              </span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Catalog integration"
                className="mt-2 h-11 w-full rounded-xl border border-[var(--a-border)] px-3.5 text-sm outline-none transition focus:border-[var(--a-indigo)]"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-[var(--a-ink)]">
                Expiration (optional)
              </span>
              <input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="mt-2 h-11 w-full rounded-xl border border-[var(--a-border)] px-3.5 text-sm outline-none transition focus:border-[var(--a-indigo)]"
              />
            </label>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button
              disabled={!name.trim() || createMutation.isPending}
              onClick={() => createMutation.mutate()}
            >
              {createMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create key
            </Button>
          </div>
        </AdminCard>
      ) : null}

      <AdminCard variant="flush">
        <div className="border-b border-[var(--a-border)] px-6 py-5">
          <h2 className="text-sm font-semibold text-[var(--a-ink)]">
            Active keys
          </h2>
          <p className="mt-0.5 text-xs text-[var(--a-ink-3)]">
            {keys.length} key{keys.length === 1 ? "" : "s"}
          </p>
        </div>

        {keys.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <KeyRound className="mx-auto h-8 w-8 text-[var(--a-ink-3)]" />
            <p className="mt-3 text-sm font-semibold text-[var(--a-ink)]">
              No API keys
            </p>
            <p className="mt-1 text-sm text-[var(--a-ink-2)]">
              Create one when you need application access.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-[var(--a-border)] px-4 py-2">
            {keys.map((key) => {
              const revoked = Boolean(key.revokedAt);
              const expired = Boolean(key.expiresAt && new Date(key.expiresAt).getTime() <= Date.now());
              const inactive = revoked || expired;
              return (
                <li key={key.id}>
                  <ListRow
                    icon={<KeyRound className="h-4 w-4" />}
                    leadingBadgeTone={inactive ? "rose" : "indigo"}
                    title={key.name}
                    subtitle={`Created ${date(key.createdAt)} · Last used ${date(
                      key.lastUsedAt,
                    )}${key.expiresAt ? ` · Expires ${date(key.expiresAt)}` : ""}`}
                    trailing={
                      <>
                        <StatusBadge status={revoked ? "CANCELLED" : expired ? "EXPIRED" : "ACTIVE"} />
                        {!inactive ? (
                          <button
                            type="button"
                            disabled={revokeMutation.isPending}
                            onClick={() => setConfirmKey(key)}
                            className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--a-ink-3)] transition hover:bg-[var(--a-rose-soft)] hover:text-[var(--a-rose)] disabled:opacity-50"
                            aria-label="Revoke key"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        ) : null}
                      </>
                    }
                  />
                </li>
              );
            })}
          </ul>
        )}
      </AdminCard>

      <ConfirmActionDialog
        isOpen={confirmKey !== null}
        title="Revoke API key?"
        description="Applications using this key will no longer be able to authenticate."
        confirmLabel="Revoke"
        isDestructive
        isLoading={revokeMutation.isPending}
        onCancel={() => setConfirmKey(null)}
        onConfirm={() => {
          if (confirmKey) revokeMutation.mutate(confirmKey.id);
        }}
      />
    </div>
  );
}
