import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import {
  CalendarClock,
  FileText,
  LayoutGrid,
  Receipt,
  Repeat,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { cn } from "cn";
import { AppLogo } from "@/components/app-logo";

type Intent = "ADMIN" | "CUSTOMER";

interface Bullet {
  icon: LucideIcon;
  title: string;
  description: string;
}

interface AuthBrandPanelProps {
  intent?: Intent;
  headline?: ReactNode;
  supporting?: string;
  bullets?: Bullet[];
}

/* ─────────────────────────────────────────────────────────────
   Copy per intent
   ───────────────────────────────────────────────────────────── */

const ADMIN_COPY: { headline: ReactNode; supporting: string; bullets: Bullet[] } = {
  headline: (
    <>
      Run subscriptions without the{" "}
      <span className="text-[var(--color-accent)]">busywork.</span>
    </>
  ),
  supporting:
    "Services, pricing plans, invoicing, proration, a credit ledger and webhook delivery — the billing engine is already built. You focus on the business.",
  bullets: [
    {
      icon: Repeat,
      title: "Automatic proration",
      description: "Upgrades and downgrades recalculate on the fly.",
    },
    {
      icon: ShieldCheck,
      title: "Idempotent operations",
      description: "Every mutation is safe to retry.",
    },
    {
      icon: Receipt,
      title: "Tax-aware invoicing",
      description: "Multi-currency invoices with line items.",
    },
    // {
    //   icon: Webhook,
    //   title: "Signed webhooks",
    //   description: "Every lifecycle event delivered, retried until it lands.",
    // },
  ],
};

const CUSTOMER_COPY: { headline: ReactNode; supporting: string; bullets: Bullet[] } = {
  headline: (
    <>
      One place for every{" "}
      <span className="text-[var(--color-accent)]">subscription</span> you pay
      for.
    </>
  ),
  supporting:
    "See what you're subscribed to, when it renews, and what it costs — across every business you subscribe through, in one dashboard.",
  bullets: [
    {
      icon: CalendarClock,
      title: "Live renewal dates",
      description: "Always know when a plan renews and what it'll cost.",
    },
    {
      icon: Wallet,
      title: "Instant credit tracking",
      description:
        "Cancellations and adjustments show up as usable credit.",
    },
    {
      icon: LayoutGrid,
      title: "One login, every business",
      description: "Every subscription you hold, in a single portal.",
    },
    {
      icon: FileText,
      title: "Full invoice history",
      description: "Every past charge, itemized and downloadable.",
    },
  ],
};

/* ─────────────────────────────────────────────────────────────
   Intent-aware mock card
   ───────────────────────────────────────────────────────────── */

function IntentMockCard({ intent }: { intent: Intent }) {
  if (intent === "CUSTOMER") {
    return (
      <div className="w-[224px] rounded-2xl border border-white/10 bg-white/5 p-3.5 shadow-[0_20px_40px_-20px_rgba(0,0,0,0.55)] backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
            Subscription
          </p>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-positive)]/15 px-2 py-0.5 text-[10px] font-semibold text-[var(--color-positive)]">
            <span className="h-1 w-1 rounded-full bg-[var(--color-positive)]" />
            Active
          </span>
        </div>
        <p className="mt-2 text-sm font-semibold text-white">Pro plan</p>
        <p className="mt-0.5 text-xs text-white/50 tabular-nums">
          ₹4,999 / mo
        </p>
        <p className="mt-2 border-t border-white/10 pt-2 text-[11px] text-white/40">
          Renews in 12 days
        </p>
      </div>
    );
  }

  // ADMIN
  return (
    <div className="w-[224px] rounded-2xl border border-white/10 bg-white/5 p-3.5 shadow-[0_20px_40px_-20px_rgba(0,0,0,0.55)] backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
          Invoice
        </p>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-positive)]/15 px-2 py-0.5 text-[10px] font-semibold text-[var(--color-positive)]">
          <span className="h-1 w-1 rounded-full bg-[var(--color-positive)]" />
          Paid
        </span>
      </div>
      <p className="mt-2 font-mono text-xs font-semibold text-white">
        INV-2026-000418
      </p>
      <p className="mt-1 text-lg font-semibold tabular-nums text-white">
        ₹4,128.82
      </p>
      <p className="mt-2 border-t border-white/10 pt-2 text-[11px] text-white/40">
        Pro plan · monthly
      </p>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Panel
   ───────────────────────────────────────────────────────────── */

export function AuthBrandPanel({
  intent = "ADMIN",
  headline,
  supporting,
  bullets,
}: AuthBrandPanelProps) {
  const defaults = intent === "CUSTOMER" ? CUSTOMER_COPY : ADMIN_COPY;

  const resolvedHeadline = headline ?? defaults.headline;
  const resolvedSupporting = supporting ?? defaults.supporting;
  const resolvedBullets = bullets ?? defaults.bullets;

  const year = new Date().getFullYear();

  return (
    <aside className="relative hidden overflow-hidden bg-[var(--color-surface-dark)] p-12 text-white lg:flex lg:flex-col lg:justify-between">
      {/* Atmospheric glow + grid */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 -top-32 h-[480px] w-[480px] rounded-full bg-[var(--color-accent)]/20 blur-3xl" />
        <div className="absolute -bottom-40 -right-24 h-[420px] w-[420px] rounded-full bg-indigo-500/25 blur-3xl" />
        <div className="absolute inset-0 opacity-[0.05] [background-image:linear-gradient(rgba(255,255,255,0.6)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.6)_1px,transparent_1px)] [background-size:32px_32px]" />
      </div>

      {/* Brand */}
      {/* Brand */}
      {/* Brand */}
      <div className="relative flex items-center gap-3">
        <AppLogo variant="mark" className="h-9 w-9" />

        <span className="text-base font-semibold tracking-tight text-white">
          Subvia
        </span>
      </div>

      {/* Middle — copy + bullets + mock card */}
      <div className="relative max-w-md">
        {/* Headline + supporting (cross-fade on intent change) */}
        <div key={`copy-${intent}`} className="animate-fade-in">
          <h2 className="text-4xl font-semibold leading-[1.12] tracking-tight text-white">
            {resolvedHeadline}
          </h2>
          <p className="mt-5 text-sm leading-relaxed text-white/60">
            {resolvedSupporting}
          </p>
        </div>

        {/* Bullets */}
        {resolvedBullets.length > 0 ? (
          <ul
            key={`bullets-${intent}`}
            className="animate-fade-in mt-10 space-y-5"
          >
            {resolvedBullets.map(({ icon: Icon, title, description }) => (
              <li key={title} className="flex items-start gap-3.5">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 ring-1 ring-white/10">
                  <Icon className="h-4 w-4 text-[var(--color-accent)]" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">{title}</p>
                  <p className="mt-0.5 text-xs text-white/55">{description}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : null}

        {/* Mock card — staggered fade-in */}
        <div
          key={`mock-${intent}`}
          className={cn("mt-10 animate-fade-in w-fit")}
          style={{ animationDelay: "150ms" }}
        >
          <div className="-rotate-2">
            <IntentMockCard intent={intent} />
          </div>
        </div>
      </div>

      {/* Closing line + copyright */}
      <div className="relative space-y-2">
        <p className="text-xs text-white/40">
          Built for teams who&rsquo;d rather ship product than reinvent
          billing.
        </p>
        <p className="text-xs text-white/40">© {year} Subvia</p>
      </div>
    </aside>
  );
}