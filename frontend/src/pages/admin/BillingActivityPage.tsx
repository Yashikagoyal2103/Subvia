import { Activity, CheckCircle2, Clock3, XCircle } from "lucide-react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "../../api/admin";
import { LoadingState } from "../../components/loading-state";
import { ErrorState } from "../../components/error-state";

function dateTime(value: string) {
  return new Date(value).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function label(type: string) {
  return type.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function icon(type: string) {
  if (["CREATED", "UPGRADED", "DOWNGRADE_APPLIED", "RENEWED", "PAYMENT_SUCCEEDED"].includes(type)) return <CheckCircle2 className="h-5 w-5 text-emerald-600" />;
  if (["PAYMENT_FAILED", "CANCELLED"].includes(type)) return <XCircle className="h-5 w-5 text-red-500" />;
  return <Clock3 className="h-5 w-5 text-amber-600" />;
}

export function AdminBillingActivityPage() {
  const { businessId } = useParams<{ businessId: string }>();
  const query = useQuery({ queryKey: ["admin-billing-activity", businessId], queryFn: () => adminApi.billingActivity(businessId!), enabled: Boolean(businessId) });

  if (!businessId) return <ErrorState description="A valid business context is required." />;
  if (query.isLoading) return <LoadingState message="Loading billing activity..." />;
  if (query.isError) return <ErrorState description="We couldn't load billing activity." retryAction={() => query.refetch()} />;

  const events = query.data?.data ?? [];

  return (
    <div className="space-y-8">
      <header><p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">Audit trail</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-gray-900">Billing Activity</h1><p className="mt-2 text-sm text-gray-500">A business-wide timeline of subscription and payment lifecycle events.</p></header>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        {events.length === 0 ? (
          <div className="py-16 text-center"><Activity className="mx-auto h-10 w-10 text-gray-300" /><p className="mt-4 font-semibold">No billing activity yet</p><p className="mt-1 text-sm text-gray-500">Subscription events will appear here.</p></div>
        ) : (
          <div className="relative space-y-0">
            {events.map((event, index) => (
              <div key={event.id} className="relative flex gap-4 pb-7">
                {index < events.length - 1 && <div className="absolute left-5 top-10 h-full w-px bg-gray-200" />}
                <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white">{icon(event.type)}</div>
                <div className="min-w-0 flex-1 rounded-xl border border-gray-100 bg-gray-50/60 p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"><div><p className="font-semibold text-gray-900">{label(event.type)}</p><p className="mt-1 text-sm text-gray-500">{event.subscription.plan.service.name} · {event.subscription.plan.name}</p><p className="mt-1 text-xs text-gray-400">{event.subscription.customerProfile.user.email}</p></div><time className="text-xs text-gray-400">{dateTime(event.createdAt)}</time></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}