

import { useEffect, useState } from "react";
import { CalendarDays, Mail, ShieldCheck, UserRound } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { authApi } from "@/api/auth";
import { useAuthStore } from "@/stores/auth.store";

import { AdminCard } from "@/components/admin/AdminCard";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";

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

export function AdminProfilePage() {
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

  const fullName =
    `${user.firstName} ${user.lastName}`.trim();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Account"
        title="Profile"
        description="Manage your personal Subvia account details."
      />

      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <AdminCard>
          <div className="flex flex-col items-center text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--a-indigo-soft)] text-xl font-semibold text-[var(--a-indigo)]">
              {firstName.charAt(0)}
              {lastName.charAt(0)}
            </div>

            <h2 className="mt-4 text-lg font-semibold text-[var(--a-ink)]">
              {fullName || "Your profile"}
            </h2>

            <p className="mt-1 text-sm text-[var(--a-ink-2)]">
              {user.email}
            </p>

            <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[var(--a-indigo-soft)] px-3 py-1 text-[11px] font-semibold text-[var(--a-indigo)]">
              <ShieldCheck className="h-3.5 w-3.5" />
              Business Admin
            </span>
          </div>
        </AdminCard>

        <AdminCard>
          <div className="flex items-start gap-3 border-b border-[var(--a-border)] pb-5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--a-indigo-soft)] text-[var(--a-indigo)]">
              <UserRound className="h-4 w-4" />
            </span>

            <div>
              <h2 className="text-sm font-semibold text-[var(--a-ink)]">
                Personal information
              </h2>

              <p className="mt-0.5 text-xs text-[var(--a-ink-2)]">
                Update the name associated with your account.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-semibold text-[var(--a-ink)]">
                First name
              </span>

              <input
                value={firstName}
                onChange={(event) =>
                  setFirstName(event.target.value)
                }
                disabled={updateMutation.isPending}
                className="mt-2 h-11 w-full rounded-xl border border-[var(--a-border)] px-3.5 text-sm outline-none transition focus:border-[var(--a-indigo)] disabled:bg-[var(--a-canvas-2)]"
              />
            </label>

            <label className="block">
              <span className="text-xs font-semibold text-[var(--a-ink)]">
                Last name
              </span>

              <input
                value={lastName}
                onChange={(event) =>
                  setLastName(event.target.value)
                }
                disabled={updateMutation.isPending}
                className="mt-2 h-11 w-full rounded-xl border border-[var(--a-border)] px-3.5 text-sm outline-none transition focus:border-[var(--a-indigo)] disabled:bg-[var(--a-canvas-2)]"
              />
            </label>
          </div>

          <div className="mt-6 flex justify-end border-t border-[var(--a-border)] pt-5">
            <Button
              disabled={saveDisabled}
              onClick={() =>
                updateMutation.mutate()
              }
            >
              {updateMutation.isPending
                ? "Saving…"
                : "Save changes"}
            </Button>
          </div>
        </AdminCard>
      </div>

      <AdminCard>
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--a-canvas-2)] text-[var(--a-ink-2)]">
            <Mail className="h-4 w-4" />
          </span>

          <div>
            <h2 className="text-sm font-semibold text-[var(--a-ink)]">
              Account information
            </h2>

            <p className="mt-0.5 text-xs text-[var(--a-ink-2)]">
              These account details are currently read-only.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Info
            icon={<Mail className="h-3.5 w-3.5" />}
            label="Email"
            value={user.email}
          />

          <Info
            icon={<ShieldCheck className="h-3.5 w-3.5" />}
            label="Account type"
            value="Admin"
          />

          <Info
            icon={<CalendarDays className="h-3.5 w-3.5" />}
            label="Member since"
            value={formatDate(user.createdAt)}
          />
        </div>
      </AdminCard>
    </div>
  );
}

function Info({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-[var(--a-canvas-2)] p-4">
      <div className="flex items-center gap-1.5 text-[var(--a-ink-3)]">
        {icon}
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em]">
          {label}
        </p>
      </div>

      <p className="mt-2 truncate text-sm font-medium text-[var(--a-ink)]">
        {value}
      </p>
    </div>
  );
}

