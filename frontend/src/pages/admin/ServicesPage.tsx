import { useState } from "react";
import { Edit3, Layers, Loader2, Plus, X } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { servicesApi, type Service } from "../../api/services";
import { Button } from "../../components/ui/button";
import { StatusBadge } from "../../components/status-badge";
import { queryClient } from "../../lib/query-client";

export function AdminServicesPage() {
  const { businessId } = useParams<{ businessId: string }>();
  const [editing, setEditing] = useState<Service | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const query = useQuery({
    queryKey: ["services", businessId],
    queryFn: () => servicesApi.list(businessId!),
    enabled: Boolean(businessId),
  });

  const mutation = useMutation({
    mutationFn: async (input: { id?: string; name: string; description?: string }) => {
      if (input.id) return servicesApi.update(businessId!, input.id, { name: input.name, description: input.description });
      return servicesApi.create(businessId!, { name: input.name, description: input.description });
    },
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: ["services", businessId] });
      setEditing(null);
      setShowCreate(false);
      toast.success(variables.id ? "Service updated." : "Service created.");
    },
    onError: error => {
      const message = axios.isAxiosError(error) ? error.response?.data?.error?.message : undefined;
      toast.error(message ?? "Unable to save service.");
    },
  });

  if (!businessId) return <PageMessage text="A valid business context is required." />;
  if (query.isLoading) return <PageMessage text="Loading services..." loading />;
  if (query.isError) return <PageMessage text="Unable to load services." retry={() => query.refetch()} />;

  const services = query.data ?? [];

  return (
    <div className="mx-auto max-w-7xl space-y-7">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">Catalog</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-gray-900">Services</h1>
          <p className="mt-2 text-sm text-gray-500">Create and manage the recurring services your business offers.</p>
        </div>
        <Button onClick={() => setShowCreate(true)}><Plus className="mr-2 h-4 w-4" />Create service</Button>
      </header>

      {services.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center">
          <Layers className="mx-auto h-9 w-9 text-gray-300" />
          <h2 className="mt-4 font-semibold text-gray-900">No services yet</h2>
          <p className="mt-1 text-sm text-gray-500">Create your first service to start building plans.</p>
          <Button className="mt-5" onClick={() => setShowCreate(true)}><Plus className="mr-2 h-4 w-4" />Create service</Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {services.map(service => (
            <div key={service.id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"><Layers className="h-5 w-5" /></div>
                <StatusBadge status={service.isActive ? "ACTIVE" : "INACTIVE"} />
              </div>

              <h2 className="mt-5 text-lg font-semibold text-gray-900">{service.name}</h2>
              <p className="mt-2 min-h-10 text-sm text-gray-500">{service.description || "No description provided."}</p>

              <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4">
                <span className="text-xs text-gray-400">Created {new Date(service.createdAt).toLocaleDateString("en-IN")}</span>
                <button type="button" onClick={() => setEditing(service)} className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700"><Edit3 className="h-4 w-4" />Edit</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {(showCreate || editing) && (
        <ServiceModal service={editing} loading={mutation.isPending} onClose={() => { setShowCreate(false); setEditing(null); }} onSubmit={data => mutation.mutate({ ...data, id: editing?.id })} />
      )}
    </div>
  );
}

function ServiceModal({ service, loading, onClose, onSubmit }: { service: Service | null; loading: boolean; onClose: () => void; onSubmit: (data: { name: string; description?: string }) => void }) {
  const [name, setName] = useState(service?.name ?? "");
  const [description, setDescription] = useState(service?.description ?? "");

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    onSubmit({ name: name.trim(), description: description.trim() || undefined });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/30 p-4 backdrop-blur-sm">
      <form onSubmit={submit} className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between">
          <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600">Catalog</p><h2 className="mt-1 text-xl font-semibold text-gray-900">{service ? "Edit service" : "Create service"}</h2></div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"><X className="h-5 w-5" /></button>
        </div>

        <div className="mt-6 space-y-4">
          <label className="block"><span className="text-sm font-medium text-gray-700">Name</span><input value={name} onChange={e => setName(e.target.value)} minLength={2} maxLength={100} required className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" placeholder="Cloud Storage" /></label>
          <label className="block"><span className="text-sm font-medium text-gray-700">Description</span><textarea value={description} onChange={e => setDescription(e.target.value)} maxLength={500} rows={4} className="mt-2 w-full resize-none rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" placeholder="Describe what this service provides..." /></label>
        </div>

        <div className="mt-6 flex justify-end gap-3"><Button type="button" variant="outline" onClick={onClose}>Cancel</Button><Button disabled={loading}>{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{service ? "Save changes" : "Create service"}</Button></div>
      </form>
    </div>
  );
}

function PageMessage({ text, loading = false, retry }: { text: string; loading?: boolean; retry?: () => void }) {
  return <div className="flex min-h-[350px] items-center justify-center"><div className="text-center">{loading && <Loader2 className="mx-auto h-7 w-7 animate-spin text-indigo-600" />}<p className="mt-3 text-sm text-gray-500">{text}</p>{retry && <button onClick={retry} className="mt-2 text-sm font-medium text-indigo-600">Try again</button>}</div></div>;
}