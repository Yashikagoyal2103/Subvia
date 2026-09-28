

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
  CalendarDays,
  Mail,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { authApi } from "@/api/auth";
import { useAuthStore } from "@/stores/auth.store";

import { CustomerPageHeader } from "@/components/customer/CustomerPageHeader";
import { GlassPanel } from "@/components/customer/GlassPanel";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(
    "en-IN",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
    },
  );
}

export function CustomerProfilePage() {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const queryClient = useQueryClient();

  const [firstName, setFirstName] = useState(
    user?.firstName ?? "",
  );
  const [lastName, setLastName] = useState(
    user?.lastName ?? "",
  );

  useEffect(() => {
    if (!user) return;

    setFirstName(user.firstName);
    setLastName(user.lastName);
  }, [user]);

  const updateMutation = useMutation({
    mutationFn: () =>
      authApi.updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      }),

    onSuccess: async (updatedUser) => {
      setUser(updatedUser);

      await queryClient.invalidateQueries({
        queryKey: ["current-user"],
      });

      toast.success("Profile updated.");
    },

    onError: () => {
      toast.error(
        "Unable to update your profile.",
      );
    },
  });

  if (!user) {
    return null;
  }

  const saveDisabled =
    firstName.trim().length < 2 ||
    lastName.trim().length < 2 ||
    updateMutation.isPending;

  const initials =
    `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

  return (
    <div className="space-y-8">
      <CustomerPageHeader
        title="Profile"
        description="Manage your personal Subvia account details."
      />

      <div className="grid gap-6 lg:grid-cols-[0.75fr_1.25fr]">
        <GlassPanel className="p-7">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--color-charcoal)] text-xl font-semibold text-white">
              {initials || "U"}
            </div>

            <h2 className="mt-5 text-lg font-semibold tracking-tight text-[var(--color-ink)]">
              {firstName} {lastName}
            </h2>

            <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
              {user.email}
            </p>

            <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[var(--color-positive-soft)] px-3 py-1 text-[11px] font-semibold text-[#155f3c]">
              <ShieldCheck className="h-3.5 w-3.5" />
              Customer account
            </span>
          </div>
        </GlassPanel>

        <GlassPanel>
          <div className="border-b border-[rgba(20,22,26,0.06)] px-6 py-5">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[rgba(20,22,26,0.05)] text-[var(--color-ink-muted)]">
                <UserRound className="h-4 w-4" />
              </span>

              <div>
                <h2 className="text-sm font-semibold text-[var(--color-ink)]">
                  Personal information
                </h2>

                <p className="mt-0.5 text-xs text-[var(--color-ink-muted)]">
                  Update the name associated with your account.
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block">
                <span className="text-xs font-semibold text-[var(--color-ink)]">
                  First name
                </span>

                <input
                  value={firstName}
                  onChange={(event) =>
                    setFirstName(event.target.value)
                  }
                  disabled={updateMutation.isPending}
                  className="mt-2 h-11 w-full rounded-xl border border-[rgba(20,22,26,0.1)] bg-white/70 px-3.5 text-sm text-[var(--color-ink)] outline-none transition focus:border-[var(--color-charcoal)] disabled:opacity-60"
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-[var(--color-ink)]">
                  Last name
                </span>

                <input
                  value={lastName}
                  onChange={(event) =>
                    setLastName(event.target.value)
                  }
                  disabled={updateMutation.isPending}
                  className="mt-2 h-11 w-full rounded-xl border border-[rgba(20,22,26,0.1)] bg-white/70 px-3.5 text-sm text-[var(--color-ink)] outline-none transition focus:border-[var(--color-charcoal)] disabled:opacity-60"
                />
              </label>
            </div>

            <div className="mt-6 flex justify-end border-t border-[rgba(20,22,26,0.06)] pt-5">
              <button
                type="button"
                disabled={saveDisabled}
                onClick={() =>
                  updateMutation.mutate()
                }
                className="rounded-full bg-[var(--color-charcoal)] px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {updateMutation.isPending
                  ? "Saving…"
                  : "Save changes"}
              </button>
            </div>
          </div>
        </GlassPanel>
      </div>

      <GlassPanel>
        <div className="border-b border-[rgba(20,22,26,0.06)] px-6 py-5">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[rgba(20,22,26,0.05)] text-[var(--color-ink-muted)]">
              <Mail className="h-4 w-4" />
            </span>

            <div>
              <h2 className="text-sm font-semibold text-[var(--color-ink)]">
                Account information
              </h2>

              <p className="mt-0.5 text-xs text-[var(--color-ink-muted)]">
                These account details are currently read-only.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
          <Info
            icon={<Mail className="h-3.5 w-3.5" />}
            label="Email"
            value={user.email}
          />

          <Info
            icon={<ShieldCheck className="h-3.5 w-3.5" />}
            label="Account type"
            value="Customer"
          />

          <Info
            icon={<CalendarDays className="h-3.5 w-3.5" />}
            label="Member since"
            value={formatDate(user.createdAt)}
          />

        </div>
      </GlassPanel>
    </div>
  );
}

function Info({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-[rgba(20,22,26,0.035)] p-4">
      <div className="flex items-center gap-1.5 text-[var(--color-ink-subtle)]">
        {icon}

        <p className="text-[10px] font-semibold uppercase tracking-[0.14em]">
          {label}
        </p>
      </div>

      <p className="mt-2 truncate text-sm font-medium text-[var(--color-ink)]">
        {value}
      </p>
    </div>
  );
}

