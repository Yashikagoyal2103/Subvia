import { useState } from "react";
import {
  Copy,
  KeyRound,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";

import {
  apiKeysApi,
  type ApiKey,
} from "../../api/api-keys";
import { Button } from "../../components/ui/button";
import { LoadingState } from "../../components/loading-state";
import { ErrorState } from "../../components/error-state";
import { queryClient } from "../../lib/query-client";

function date(value: string | null) {
  if (!value) {
    return "Never";
  }

  return new Date(value).toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  );
}

export function AdminApiKeysPage() {
  const { businessId } =
    useParams<{ businessId: string }>();

  const [name, setName] = useState("");
  const [expiresAt, setExpiresAt] =
    useState("");
  const [showCreate, setShowCreate] =
    useState(false);
  const [createdKey, setCreatedKey] =
    useState<string | null>(null);

  const query = useQuery({
    queryKey: ["api-keys", businessId],
    queryFn: () =>
      apiKeysApi.list(businessId!),
    enabled: Boolean(businessId),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      apiKeysApi.create(
        businessId!,
        {
          name: name.trim(),
          ...(expiresAt
            ? { expiresAt }
            : {}),
        },
      ),
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

      toast.error(
        message ?? "Unable to create API key.",
      );
    },
  });

  const revokeMutation = useMutation({
    mutationFn: (apiKeyId: string) =>
      apiKeysApi.revoke(
        businessId!,
        apiKeyId,
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["api-keys", businessId],
      });

      toast.success("API key revoked.");
    },
  });

  if (!businessId) {
    return (
      <ErrorState description="A valid business context is required." />
    );
  }

  if (query.isLoading) {
    return <LoadingState message="Loading API keys..." />;
  }

  if (query.isError) {
    return (
      <ErrorState
        description="We couldn't load API keys."
        retryAction={() => query.refetch()}
      />
    );
  }

  const keys = query.data ?? [];

  const copyKey = async () => {
    if (!createdKey) {
      return;
    }

    await navigator.clipboard.writeText(
      createdKey,
    );

    toast.success("API key copied.");
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">
            Developer access
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-gray-950">
            API keys
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Give external applications authenticated access
            to your public catalog API.
          </p>
        </div>

        <Button
          onClick={() => {
            setShowCreate(true);
            setCreatedKey(null);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Create API key
        </Button>
      </header>

      {createdKey && (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-start gap-3">
            <KeyRound className="mt-0.5 h-5 w-5 text-amber-700" />

            <div className="min-w-0 flex-1">
              <h2 className="font-semibold text-amber-950">
                Save this API key
              </h2>

              <p className="mt-1 text-sm text-amber-800">
                The raw key is shown only once.
              </p>

              <div className="mt-4 flex gap-2">
                <code className="min-w-0 flex-1 overflow-x-auto rounded-lg border border-amber-200 bg-white px-3 py-2 text-xs text-gray-700">
                  {createdKey}
                </code>

                <Button
                  variant="outline"
                  onClick={copyKey}
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
            Create API key
          </h2>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-gray-700">
                Name
              </span>

              <input
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                placeholder="Catalog integration"
                className="mt-2 h-10 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-gray-700">
                Expiration
              </span>

              <input
                type="date"
                value={expiresAt}
                onChange={(event) =>
                  setExpiresAt(event.target.value)
                }
                className="mt-2 h-10 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
            </label>
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowCreate(false)}
            >
              Cancel
            </Button>

            <Button
              disabled={
                !name.trim() ||
                createMutation.isPending
              }
              onClick={() =>
                createMutation.mutate()
              }
            >
              {createMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create key
            </Button>
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-6 py-5">
          <h2 className="font-semibold text-gray-900">
            API keys
          </h2>
        </div>

        {keys.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <KeyRound className="mx-auto h-10 w-10 text-gray-300" />

            <h3 className="mt-4 font-semibold text-gray-900">
              No API keys
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Create one when you need application access.
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {keys.map((apiKey: ApiKey) => {
              const revoked = Boolean(
                apiKey.revokedAt,
              );

              return (
                <div
                  key={apiKey.id}
                  className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                      <KeyRound className="h-5 w-5" />
                    </div>

                    <div>
                      <p className="font-medium text-gray-900">
                        {apiKey.name}
                      </p>

                      <p className="mt-1 text-xs text-gray-400">
                        Created {date(apiKey.createdAt)}
                        {" · "}
                        Last used {date(apiKey.lastUsedAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        revoked
                          ? "bg-gray-100 text-gray-500"
                          : "bg-emerald-50 text-emerald-700"
                      }`}
                    >
                      {revoked
                        ? "REVOKED"
                        : "ACTIVE"}
                    </span>

                    {!revoked && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={
                          revokeMutation.isPending
                        }
                        onClick={() =>
                          revokeMutation.mutate(
                            apiKey.id,
                          )
                        }
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Revoke
                      </Button>
                    )}
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