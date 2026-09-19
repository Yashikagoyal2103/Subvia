import { useState } from "react";
import {
  Copy,
  Globe,
  Loader2,
  Plus,
  Trash2,
  Webhook,
} from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";

import {
  webhooksApi,
  type WebhookEndpointStatus,
} from "../../api/webhooks";
import { Button } from "../../components/ui/button";
import { LoadingState } from "../../components/loading-state";
import { ErrorState } from "../../components/error-state";
import { queryClient } from "../../lib/query-client";

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

export function AdminWebhooksPage() {
  const { businessId } =
    useParams<{ businessId: string }>();

  const [url, setUrl] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [secret, setSecret] = useState<string | null>(
    null,
  );

  const query = useQuery({
    queryKey: ["webhooks", businessId],
    queryFn: () =>
      webhooksApi.list(businessId!),
    enabled: Boolean(businessId),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      webhooksApi.create(
        businessId!,
        { url: url.trim() },
      ),
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

      toast.error(
        message ?? "Unable to create webhook.",
      );
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (input: {
      endpointId: string;
      status: WebhookEndpointStatus;
    }) =>
      webhooksApi.update(
        businessId!,
        input.endpointId,
        { status: input.status },
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["webhooks", businessId],
      });

      toast.success("Webhook status updated.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (endpointId: string) =>
      webhooksApi.remove(
        businessId!,
        endpointId,
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["webhooks", businessId],
      });

      toast.success("Webhook endpoint removed.");
    },
  });

  if (!businessId) {
    return (
      <ErrorState description="A valid business context is required." />
    );
  }

  if (query.isLoading) {
    return <LoadingState message="Loading webhooks..." />;
  }

  if (query.isError) {
    return (
      <ErrorState
        description="We couldn't load webhook endpoints."
        retryAction={() => query.refetch()}
      />
    );
  }

  const endpoints = query.data ?? [];

  const copySecret = async () => {
    if (!secret) {
      return;
    }

    await navigator.clipboard.writeText(secret);
    toast.success("Webhook secret copied.");
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">
            Integrations
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-gray-950">
            Webhooks
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Receive subscription and payment lifecycle events
            from your billing platform.
          </p>
        </div>

        <Button
          onClick={() => {
            setShowCreate(true);
            setSecret(null);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add endpoint
        </Button>
      </header>

      {secret && (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-start gap-3">
            <Webhook className="mt-0.5 h-5 w-5 text-amber-700" />

            <div className="min-w-0 flex-1">
              <h2 className="font-semibold text-amber-950">
                Save this webhook secret
              </h2>

              <p className="mt-1 text-sm text-amber-800">
                This secret is shown only when the endpoint is
                created.
              </p>

              <div className="mt-4 flex gap-2">
                <code className="min-w-0 flex-1 overflow-x-auto rounded-lg border border-amber-200 bg-white px-3 py-2 text-xs text-gray-700">
                  {secret}
                </code>

                <Button
                  variant="outline"
                  onClick={copySecret}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}

      {showCreate && (
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-gray-900">
            New webhook endpoint
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Use an HTTPS endpoint in a real integration.
          </p>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <input
              value={url}
              onChange={(event) =>
                setUrl(event.target.value)
              }
              placeholder="https://example.com/webhooks"
              className="h-10 flex-1 rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />

            <Button
              disabled={
                !url.trim() ||
                createMutation.isPending
              }
              onClick={() =>
                createMutation.mutate()
              }
            >
              {createMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create endpoint
            </Button>

            <Button
              variant="outline"
              onClick={() => setShowCreate(false)}
            >
              Cancel
            </Button>
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-6 py-5">
          <h2 className="font-semibold text-gray-900">
            Configured endpoints
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            {endpoints.length} endpoint
            {endpoints.length === 1 ? "" : "s"} configured.
          </p>
        </div>

        {endpoints.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <Globe className="mx-auto h-10 w-10 text-gray-300" />

            <h3 className="mt-4 font-semibold text-gray-900">
              No webhook endpoints
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Add an endpoint to receive billing events.
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {endpoints.map((endpoint) => {
              const active =
                endpoint.status === "ACTIVE";

              return (
                <div
                  key={endpoint.id}
                  className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                      <Webhook className="h-5 w-5" />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate font-medium text-gray-900">
                        {endpoint.url}
                      </p>

                      <p className="mt-1 text-xs text-gray-400">
                        Created {date(endpoint.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        active
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {endpoint.status}
                    </span>

                    <Button
                      variant="outline"
                      size="sm"
                      disabled={
                        toggleMutation.isPending
                      }
                      onClick={() =>
                        toggleMutation.mutate({
                          endpointId: endpoint.id,
                          status: active
                            ? "DISABLED"
                            : "ACTIVE",
                        })
                      }
                    >
                      {active
                        ? "Disable"
                        : "Enable"}
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      disabled={
                        deleteMutation.isPending
                      }
                      onClick={() =>
                        deleteMutation.mutate(
                          endpoint.id,
                        )
                      }
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Remove
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}