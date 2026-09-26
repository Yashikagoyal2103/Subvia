import { useState } from "react";
import { Copy, Globe, Loader2, Plus, Trash2, Webhook } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";

import {
  webhooksApi,
  type WebhookEndpoint,
  type WebhookEndpointStatus,
} from "../../api/webhooks";
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

function date(value: string) {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

type ConfirmKind =
  | { type: "disable"; endpoint: WebhookEndpoint }
  | { type: "delete"; endpoint: WebhookEndpoint }
  | null;

export function AdminWebhooksPage() {
  const { businessId } = useParams<{ businessId: string }>();
  const businessName = useCurrentBusinessName();

  const [url, setUrl] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [secret, setSecret] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<ConfirmKind>(null);

  const query = useQuery({
    queryKey: ["webhooks", businessId],
    queryFn: () => webhooksApi.list(businessId!),
    enabled: Boolean(businessId),
  });

  const createMutation = useMutation({
    mutationFn: () => webhooksApi.create(businessId!, { url: url.trim() }),
    onSuccess: async (endpoint) => {
      setUrl("");
      setShowCreate(false);
      setSecret(endpoint.secret);
      await queryClient.invalidateQueries({
        queryKey: ["webhooks", businessId],
      });
      toast.success("Webhook endpoint created.");
    },
    onError: (error) => {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.error?.message
        : undefined;
      toast.error(message ?? "Unable to create webhook.");
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (input: {
      endpointId: string;
      status: WebhookEndpointStatus;
    }) =>
      webhooksApi.update(businessId!, input.endpointId, {
        status: input.status,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["webhooks", businessId],
      });
      toast.success("Webhook status updated.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (endpointId: string) =>
      webhooksApi.remove(businessId!, endpointId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["webhooks", businessId],
      });
      toast.success("Webhook endpoint removed.");
      setConfirm(null);
    },
  });

  if (!businessId) {
    return <AdminErrorState message="A valid business context is required." />;
  }
  if (query.isLoading) return <AdminLoadingState variant="list" rows={4} />;
  if (query.isError) {
    return (
      <AdminErrorState
        message="We couldn't load webhook endpoints."
        onRetry={() => query.refetch()}
      />
    );
  }

  const endpoints = query.data ?? [];

  const copySecret = async () => {
    if (!secret) return;
    await navigator.clipboard.writeText(secret);
    toast.success("Webhook secret copied.");
  };

  const handleConfirm = () => {
    if (!confirm) return;
    if (confirm.type === "disable") {
      toggleMutation.mutate({
        endpointId: confirm.endpoint.id,
        status: "DISABLED",
      });
      setConfirm(null);
    } else {
      deleteMutation.mutate(confirm.endpoint.id);
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow={businessName ? `${businessName} / Webhooks` : "Admin / Webhooks"}
        title="Webhooks"
        description="Receive subscription and payment lifecycle events from your billing platform."
        actions={
          <Button
            onClick={() => {
              setShowCreate(true);
              setSecret(null);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add endpoint
          </Button>
        }
      />

      {secret ? (
        <div className="rounded-2xl border border-[var(--a-amber)]/30 bg-[var(--a-amber-soft)] px-5 py-4">
          <div className="flex items-start gap-3">
            <Webhook className="mt-0.5 h-5 w-5 text-[var(--a-amber)]" />
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-semibold text-[#7c540f]">
                Save this webhook secret
              </h2>
              <p className="mt-1 text-xs text-[#7c540f]/80">
                This secret is shown only when the endpoint is created.
              </p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <code className="min-w-0 flex-1 overflow-x-auto rounded-lg border border-[var(--a-amber)]/30 bg-white px-3 py-2 font-mono text-xs text-[var(--a-ink)]">
                  {secret}
                </code>
                <Button variant="outline" onClick={copySecret}>
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
            New webhook endpoint
          </h2>
          <p className="mt-1 text-xs text-[var(--a-ink-2)]">
            Webhook deliveries are signed and retried by BillingOS.
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/webhooks"
              className="h-11 flex-1 rounded-xl border border-[var(--a-border)] px-3.5 text-sm outline-none transition focus:border-[var(--a-indigo)]"
            />
            <Button
              disabled={!url.trim() || createMutation.isPending}
              onClick={() => createMutation.mutate()}
            >
              {createMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create endpoint
            </Button>
            <Button variant="outline" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
          </div>
        </AdminCard>
      ) : null}

      <AdminCard variant="flush">
        <div className="border-b border-[var(--a-border)] px-6 py-5">
          <h2 className="text-sm font-semibold text-[var(--a-ink)]">
            Configured endpoints
          </h2>
          <p className="mt-0.5 text-xs text-[var(--a-ink-3)]">
            {endpoints.length} endpoint{endpoints.length === 1 ? "" : "s"}{" "}
            configured
          </p>
        </div>

        {endpoints.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <Globe className="mx-auto h-8 w-8 text-[var(--a-ink-3)]" />
            <p className="mt-3 text-sm font-semibold text-[var(--a-ink)]">
              No webhook endpoints
            </p>
            <p className="mt-1 text-sm text-[var(--a-ink-2)]">
              Add an endpoint to receive billing events.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-[var(--a-border)] px-4 py-2">
            {endpoints.map((endpoint) => {
              const active = endpoint.status === "ACTIVE";
              return (
                <li key={endpoint.id}>
                  <ListRow
                    icon={<Webhook className="h-4 w-4" />}
                    leadingBadgeTone={active ? "indigo" : "rose"}
                    title={endpoint.url}
                    subtitle={`Created ${date(endpoint.createdAt)}`}
                    trailing={
                      <>
                        <StatusBadge status={endpoint.status} />
                        <button
                          type="button"
                          disabled={toggleMutation.isPending}
                          onClick={() => {
                            if (active) {
                              setConfirm({ type: "disable", endpoint });
                            } else {
                              toggleMutation.mutate({
                                endpointId: endpoint.id,
                                status: "ACTIVE",
                              });
                            }
                          }}
                          className="rounded-full border border-[var(--a-border)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--a-ink)] transition hover:border-[var(--a-border-strong)] disabled:opacity-50"
                        >
                          {active ? "Disable" : "Enable"}
                        </button>
                        <button
                          type="button"
                          disabled={deleteMutation.isPending}
                          onClick={() =>
                            setConfirm({ type: "delete", endpoint })
                          }
                          className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--a-ink-3)] transition hover:bg-[var(--a-rose-soft)] hover:text-[var(--a-rose)] disabled:opacity-50"
                          aria-label="Delete endpoint"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
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
        isOpen={confirm !== null}
        title={
          confirm?.type === "delete"
            ? "Delete webhook endpoint?"
            : "Disable webhook?"
        }
        description={
          confirm?.type === "delete"
            ? "This action cannot be undone. Deliveries to this endpoint will stop immediately."
            : "This endpoint will no longer receive new deliveries."
        }
        confirmLabel={
          confirm?.type === "delete" ? "Delete endpoint" : "Disable endpoint"
        }
        isDestructive
        isLoading={deleteMutation.isPending || toggleMutation.isPending}
        onCancel={() => setConfirm(null)}
        onConfirm={handleConfirm}
      />
    </div>
  );
}