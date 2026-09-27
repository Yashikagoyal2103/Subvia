import { useState } from "react";
import { Edit3, Layers, Loader2, Plus, X } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";

import { servicesApi, type Service } from "../../api/services";
import { Button } from "../../components/ui/button";
import { StatusBadge } from "../../components/status-badge";
import { queryClient } from "../../lib/query-client";

import { AdminCard } from "@/components/admin/AdminCard";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { AdminErrorState } from "@/components/admin/AdminErrorState";
import { AdminLoadingState } from "@/components/admin/AdminLoadingState";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { IconBadge } from "@/components/admin/IconBadge";
import { useCurrentBusinessName } from "@/hooks/useCurrentBusinessName";

export function AdminServicesPage() {
  const { businessId } = useParams<{ businessId: string }>();
  const businessName = useCurrentBusinessName();

  const [editing, setEditing] = useState<Service | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const query = useQuery({
    queryKey: ["services", businessId],
    queryFn: () => servicesApi.list(businessId!),
    enabled: Boolean(businessId),
  });

  const mutation = useMutation({
    mutationFn: async (input: {
      id?: string;
      name: string;
      description?: string;
    }) => {
      if (input.id) {
        return servicesApi.update(businessId!, input.id, {
          name: input.name,
          description: input.description,
        });
      }
      return servicesApi.create(businessId!, {
        name: input.name,
        description: input.description,
      });
    },
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ["services", businessId],
      });
      setEditing(null);
      setShowCreate(false);
      toast.success(variables.id ? "Service updated." : "Service created.");
    },
    onError: (error) => {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.error?.message
        : undefined;
      toast.error(message ?? "Unable to save service.");
    },
  });

  if (!businessId) {
    return <AdminErrorState message="A valid business context is required." />;
  }
  if (query.isLoading) return <AdminLoadingState variant="cards" rows={6} />;
  if (query.isError) {
    return (
      <AdminErrorState
        message="Unable to load services."
        onRetry={() => query.refetch()}
      />
    );
  }

  const services = query.data ?? [];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow={businessName ? `${businessName} / Services` : "Admin / Services"}
        title="Services"
        description="Create and manage the recurring services your business offers."
        actions={
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create service
          </Button>
        }
      />

      {services.length === 0 ? (
        <AdminEmptyState
          icon={Layers}
          title="No services yet"
          description="Create your first service to start building plans."
          action={
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create service
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {services.map((service) => (
            <AdminCard key={service.id} interactive className="flex flex-col">
              <div className="flex items-start justify-between gap-3">
                <IconBadge
                  icon={<Layers className="h-4 w-4" />}
                  tone="indigo"
                  size="md"
                />
                <StatusBadge
                  status={service.isActive ? "ACTIVE" : "INACTIVE"}
                />
              </div>

              <Link
                to={`/admin/${businessId}/services/${service.id}`}
                className="mt-5 block"
              >
                <h2 className="text-base font-semibold text-[var(--a-ink)] transition hover:text-[var(--a-indigo)]">
                  {service.name}
                </h2>
                <p className="mt-1.5 min-h-10 text-sm text-[var(--a-ink-2)]">
                  {service.description || "No description provided."}
                </p>
              </Link>

              <div className="mt-5 flex items-center justify-between border-t border-[var(--a-border)] pt-4">
                <span className="text-xs text-[var(--a-ink-3)]">
                  Created {new Date(service.createdAt).toLocaleDateString("en-IN")}
                </span>
                <button
                  type="button"
                  onClick={() => setEditing(service)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--a-indigo)] hover:underline"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  Edit
                </button>
              </div>
            </AdminCard>
          ))}
        </div>
      )}

      {(showCreate || editing) && (
        <ServiceModal
          service={editing}
          loading={mutation.isPending}
          onClose={() => {
            setShowCreate(false);
            setEditing(null);
          }}
          onSubmit={(data) => mutation.mutate({ ...data, id: editing?.id })}
        />
      )}
    </div>
  );
}

/* ────────── Modal (unchanged mutation flow) ────────── */

function ServiceModal({
  service,
  loading,
  onClose,
  onSubmit,
}: {
  service: Service | null;
  loading: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; description?: string }) => void;
}) {
  const [name, setName] = useState(service?.name ?? "");
  const [description, setDescription] = useState(service?.description ?? "");

  const submit = (event: React.FormEvent) => {
    event.preventDefault();

    const trimmedName = name.trim();

    if (!trimmedName) return;

    onSubmit({
      name: trimmedName,
      description: description.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(15,15,10,0.4)] p-4 backdrop-blur-sm">
      <form
        onSubmit={submit}
        className="w-full max-w-lg rounded-2xl border border-[var(--a-border)] bg-white p-6 shadow-[0_20px_50px_-20px_rgba(15,15,10,0.28)]"
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--a-indigo)]">
              Catalog
            </p>

            <h2 className="mt-1 text-xl font-semibold text-[var(--a-ink)]">
              {service ? "Edit service" : "Create service"}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg p-2 text-[var(--a-ink-3)] hover:bg-[rgba(15,15,10,0.04)] hover:text-[var(--a-ink)] disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6 space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-[var(--a-ink)]">
              Name
            </span>

            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              minLength={2}
              maxLength={100}
              required
              disabled={loading}
              className="mt-2 w-full rounded-xl border border-[var(--a-border)] px-3 py-2.5 text-sm outline-none transition focus:border-[var(--a-indigo)] disabled:opacity-60"
              placeholder="Cloud Storage"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-[var(--a-ink)]">
              Description
            </span>

            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={500}
              rows={4}
              disabled={loading}
              className="mt-2 w-full resize-none rounded-xl border border-[var(--a-border)] px-3 py-2.5 text-sm outline-none transition focus:border-[var(--a-indigo)] disabled:opacity-60"
              placeholder="Describe what this service provides..."
            />
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>

          <Button type="submit" disabled={loading}>
            {loading && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}

            {service ? "Save changes" : "Create service"}
          </Button>
        </div>
      </form>
    </div>
  );
}