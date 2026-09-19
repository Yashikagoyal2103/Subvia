import { useState } from "react";
import { CreditCard, Edit3, Loader2, Plus, X } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { plansApi, type BillingInterval, type Currency, type Plan } from "../../api/plans";
import { servicesApi } from "../../api/services";
import { Button } from "../../components/ui/button";
import { StatusBadge } from "../../components/status-badge";
import { queryClient } from "../../lib/query-client";

const symbol = { INR: "₹", USD: "$" };

export function AdminPlansPage() {
  const { businessId } = useParams<{ businessId: string }>();
  const [serviceId, setServiceId] = useState("");
  const [editing, setEditing] = useState<Plan | null>(null);
  const [creating, setCreating] = useState(false);

  const servicesQuery = useQuery({
    queryKey: ["services", businessId],
    queryFn: () => servicesApi.list(businessId!),
    enabled: Boolean(businessId),
  });

  const services = servicesQuery.data ?? [];
  const selectedServiceId = serviceId || services[0]?.id || "";

  const plansQuery = useQuery({
    queryKey: ["plans", businessId, selectedServiceId],
    queryFn: () => plansApi.list(businessId!, selectedServiceId),
    enabled: Boolean(businessId && selectedServiceId),
  });

  const mutation = useMutation({
    mutationFn: async (input: { id?: string; name: string; description?: string; price: number; currency: Currency; interval: BillingInterval }) => {
      if (input.id) return plansApi.update(businessId!, selectedServiceId, input.id, input);
      return plansApi.create(businessId!, selectedServiceId, input);
    },
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: ["plans", businessId, selectedServiceId] });
      setEditing(null);
      setCreating(false);
      toast.success(variables.id ? "Plan updated." : "Plan created.");
    },
    onError: error => {
      const message = axios.isAxiosError(error) ? error.response?.data?.error?.message : undefined;
      toast.error(message ?? "Unable to save plan.");
    },
  });

  if (!businessId) return <PageMessage text="A valid business context is required." />;
  if (servicesQuery.isLoading) return <PageMessage text="Loading services..." loading />;
  if (servicesQuery.isError) return <PageMessage text="Unable to load services." retry={() => servicesQuery.refetch()} />;

  return (
    <div className="mx-auto max-w-7xl space-y-7">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">Catalog</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-gray-900">Plans</h1><p className="mt-2 text-sm text-gray-500">Configure pricing and billing intervals for each service.</p></div>
        <Button disabled={!selectedServiceId} onClick={() => setCreating(true)}><Plus className="mr-2 h-4 w-4" />Create plan</Button>
      </header>

      {services.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center"><CreditCard className="mx-auto h-9 w-9 text-gray-300" /><h2 className="mt-4 font-semibold text-gray-900">Create a service first</h2><p className="mt-1 text-sm text-gray-500">Plans belong to a service.</p></div>
      ) : (
        <>
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <label className="block text-sm font-medium text-gray-700">Service</label>
            <select value={selectedServiceId} onChange={e => setServiceId(e.target.value)} className="mt-2 w-full max-w-md rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100">
              {services.map(service => <option key={service.id} value={service.id}>{service.name}</option>)}
            </select>
          </div>

          {plansQuery.isLoading ? <PageMessage text="Loading plans..." loading /> : plansQuery.isError ? <PageMessage text="Unable to load plans." retry={() => plansQuery.refetch()} /> : (
            plansQuery.data?.length ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {plansQuery.data.map(plan => (
                  <div key={plan.id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"><CreditCard className="h-5 w-5" /></div><StatusBadge status={plan.isActive ? "ACTIVE" : "INACTIVE"} /></div>
                    <h2 className="mt-5 text-lg font-semibold text-gray-900">{plan.name}</h2>
                    <p className="mt-1 min-h-10 text-sm text-gray-500">{plan.description || "No description provided."}</p>
                    <p className="mt-5 text-2xl font-semibold text-gray-900">{symbol[plan.currency]}{(plan.price / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}<span className="ml-1 text-xs font-normal text-gray-400">/{plan.interval.toLowerCase()}</span></p>
                    <div className="mt-5 flex justify-end border-t border-gray-100 pt-4"><button type="button" onClick={() => setEditing(plan)} className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700"><Edit3 className="h-4 w-4" />Edit</button></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center"><CreditCard className="mx-auto h-9 w-9 text-gray-300" /><h2 className="mt-4 font-semibold text-gray-900">No plans yet</h2><p className="mt-1 text-sm text-gray-500">Create the first pricing plan for this service.</p><Button className="mt-5" onClick={() => setCreating(true)}><Plus className="mr-2 h-4 w-4" />Create plan</Button></div>
            )
          )}
        </>
      )}

      {(creating || editing) && <PlanModal plan={editing} loading={mutation.isPending} onClose={() => { setCreating(false); setEditing(null); }} onSubmit={data => mutation.mutate({ ...data, id: editing?.id })} />}
    </div>
  );
}

function PlanModal({ plan, loading, onClose, onSubmit }: { plan: Plan | null; loading: boolean; onClose: () => void; onSubmit: (data: { name: string; description?: string; price: number; currency: Currency; interval: BillingInterval }) => void }) {
  const [name, setName] = useState(plan?.name ?? "");
  const [description, setDescription] = useState(plan?.description ?? "");
  const [price, setPrice] = useState(plan ? String(plan.price / 100) : "");
  const [currency, setCurrency] = useState<Currency>(plan?.currency ?? "INR");
  const [interval, setInterval] = useState<BillingInterval>(plan?.interval ?? "MONTHLY");

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const amount = Number(price);
    if (!name.trim() || !Number.isInteger(amount) || amount <= 0) return;
    onSubmit({ name: name.trim(), description: description.trim() || undefined, price: amount, currency, interval });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/30 p-4 backdrop-blur-sm">
      <form onSubmit={submit} className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600">Pricing</p><h2 className="mt-1 text-xl font-semibold text-gray-900">{plan ? "Edit plan" : "Create plan"}</h2></div><button type="button" onClick={onClose} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100"><X className="h-5 w-5" /></button></div>

        <div className="mt-6 space-y-4">
          <label className="block"><span className="text-sm font-medium text-gray-700">Name</span><input value={name} onChange={e => setName(e.target.value)} minLength={2} maxLength={100} required className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" placeholder="Pro" /></label>
          <label className="block"><span className="text-sm font-medium text-gray-700">Description</span><textarea value={description} onChange={e => setDescription(e.target.value)} maxLength={500} rows={3} className="mt-2 w-full resize-none rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" placeholder="Plan description..." /></label>

          <div className="grid gap-4 sm:grid-cols-3">
            <label className="block sm:col-span-1"><span className="text-sm font-medium text-gray-700">Price</span><input type="number" min="1" step="1" value={price} onChange={e => setPrice(e.target.value)} required className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" placeholder="699" /></label>
            <label className="block"><span className="text-sm font-medium text-gray-700">Currency</span><select value={currency} onChange={e => setCurrency(e.target.value as Currency)} className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm"><option value="INR">INR</option><option value="USD">USD</option></select></label>
            <label className="block"><span className="text-sm font-medium text-gray-700">Interval</span><select value={interval} onChange={e => setInterval(e.target.value as BillingInterval)} className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm"><option value="MONTHLY">Monthly</option><option value="YEARLY">Yearly</option></select></label>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3"><Button type="button" variant="outline" onClick={onClose}>Cancel</Button><Button disabled={loading}>{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{plan ? "Save changes" : "Create plan"}</Button></div>
      </form>
    </div>
  );
}

function PageMessage({ text, loading = false, retry }: { text: string; loading?: boolean; retry?: () => void }) {
  return <div className="flex min-h-[350px] items-center justify-center"><div className="text-center">{loading && <Loader2 className="mx-auto h-7 w-7 animate-spin text-indigo-600" />}<p className="mt-3 text-sm text-gray-500">{text}</p>{retry && <button onClick={retry} className="mt-2 text-sm font-medium text-indigo-600">Try again</button>}</div></div>;
}