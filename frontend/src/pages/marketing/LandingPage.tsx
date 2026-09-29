import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowDown,
  Building2,
  Check,
  ChevronRight,
  CreditCard,
  Divide,
  FileText,
  Menu,
  Package2,
  RefreshCw,
  Repeat,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { cn } from "cn";
import { AppLogo } from "@/components/app-logo";

/* ─────────────────────────────────────────────────────────────
   Scroll reveal
   ───────────────────────────────────────────────────────────── */

function useInView<T extends HTMLElement = HTMLDivElement>(threshold = 0.15) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof window === "undefined") return;

    const prefersReduced =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    if (prefersReduced) {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true);
            observer.disconnect();
            break;
          }
        }
      },
      { threshold, rootMargin: "0px 0px -60px 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, inView };
}

function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <div
      ref={ref}
      style={{ transitionDelay: inView ? `${delay}ms` : "0ms" }}
      className={cn(
        "transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform",
        inView ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
        className,
      )}
    >
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Wordmark — neutral square with subtle lime dot
   ───────────────────────────────────────────────────────────── */

function Wordmark({ className }: { className?: string }) {
  return <AppLogo className={cn("h-8", className)} />;
}

/* ─────────────────────────────────────────────────────────────
   Top nav
   ───────────────────────────────────────────────────────────── */

const NAV_LINKS = [
  { label: "Product", href: "#product" },
  { label: "Lifecycle", href: "#lifecycle" },
  { label: "Platform", href: "#platform" },
];

function TopNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--color-border-soft)] bg-[var(--color-surface)]/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" aria-label="Subvia home">
          <Wordmark />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-full px-4 py-2 text-sm font-medium text-[var(--color-ink-muted)] transition hover:bg-white hover:text-[var(--color-ink)]"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Link
            to="/login"
            className="rounded-full px-4 py-2 text-sm font-semibold text-[var(--color-ink)] transition hover:bg-white"
          >
            Log in
          </Link>
          <Link
            to="/register"
            className="inline-flex h-9 items-center gap-2 rounded-full bg-[var(--color-surface-dark)] px-4 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Get started
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle navigation"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-border-soft)] bg-white text-[var(--color-ink)] md:hidden"
        >
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      {open ? (
        <div className="border-t border-[var(--color-border-soft)] bg-white px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-2 text-sm font-medium text-[var(--color-ink)] transition hover:bg-[var(--color-surface)]"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="mt-4 flex flex-col gap-2 border-t border-[var(--color-border-soft)] pt-4">
            <Link
              to="/login"
              className="rounded-full border border-[var(--color-border-soft)] px-4 py-2.5 text-center text-sm font-semibold text-[var(--color-ink)]"
            >
              Log in
            </Link>
            <Link
              to="/register"
              className="rounded-full bg-[var(--color-surface-dark)] px-4 py-2.5 text-center text-sm font-semibold text-white"
            >
              Get started
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}

/* ─────────────────────────────────────────────────────────────
   Hero mock — product state, not stats
   ───────────────────────────────────────────────────────────── */

function MockBrowser() {
  return (
    <div className="overflow-hidden rounded-3xl border border-[var(--color-border-soft)] bg-white shadow-[0_40px_90px_-50px_rgba(20,22,26,0.45)]">
      {/* Chrome bar */}
      <div className="flex items-center gap-2 border-b border-[var(--color-border-soft)] bg-[var(--color-surface)] px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-border-strong)]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-border-strong)]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-border-strong)]" />
        <span className="ml-3 truncate rounded-md bg-white px-3 py-1 text-[11px] text-[var(--color-ink-subtle)] ring-1 ring-[var(--color-border-soft)]">
          app.subvia.dev/subscriptions
        </span>
      </div>

      <div className="space-y-5 p-5">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-subtle)]">
              Active subscription
            </p>
            <p className="mt-1 text-sm font-semibold text-[var(--color-ink)]">
              Acme Cloud · Pro plan
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-positive-soft)] px-2.5 py-1 text-[11px] font-semibold text-[var(--color-positive)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-positive)]" />
            Active
          </span>
        </div>

        {/* Price + billing */}
        <div className="rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-4">
          <div className="flex items-baseline justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-subtle)]">
                Price
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight text-[var(--color-ink)]">
                ₹999
                <span className="ml-1 text-sm font-normal text-[var(--color-ink-subtle)]">
                  / month
                </span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-subtle)]">
                Next billing
              </p>
              <p className="mt-1 text-sm font-semibold text-[var(--color-ink)]">
                Oct 28, 2026
              </p>
            </div>
          </div>
        </div>

        {/* Small details */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="rounded-2xl border border-[var(--color-border-soft)] p-3.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-subtle)]">
              Interval
            </p>
            <p className="mt-1 font-medium text-[var(--color-ink)]">Monthly</p>
          </div>
          <div className="rounded-2xl border border-[var(--color-border-soft)] p-3.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-subtle)]">
              Currency
            </p>
            <p className="mt-1 font-medium text-[var(--color-ink)]">INR</p>
          </div>
        </div>

        {/* Recent activity */}
        <div className="divide-y divide-[var(--color-border-soft)]">
          {[
            { label: "Invoice generated", meta: "INV-2026-000418" },
            { label: "Payment recorded", meta: "₹999.00 · Success" },
            { label: "Proration applied", meta: "Starter → Pro" },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between py-2.5">
              <p className="text-xs font-medium text-[var(--color-ink)]">
                {row.label}
              </p>
              <p className="text-[11px] tabular-nums text-[var(--color-ink-subtle)]">
                {row.meta}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FloatingProrationCard() {
  return (
    <div
      className="subvia-float absolute -right-6 top-10 hidden w-60 rounded-2xl border border-[var(--color-border-soft)] bg-white p-4 shadow-[0_24px_60px_-30px_rgba(20,22,26,0.35)] lg:block"
      style={{ animation: "subvia-float 8s ease-in-out infinite" }}
    >
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--color-surface)] text-[var(--color-ink-muted)]">
          <Divide className="h-3.5 w-3.5" />
        </span>
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-subtle)]">
          Proration
        </p>
      </div>

      <div className="mt-3 space-y-1.5 text-[11px]">
        <div className="flex items-center justify-between">
          <span className="text-[var(--color-ink-muted)]">
            Unused value
          </span>
          <span className="font-medium tabular-nums text-[var(--color-positive)]">
            −₹150
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[var(--color-ink-muted)]">
            New plan value
          </span>
          <span className="font-medium tabular-nums text-[var(--color-ink)]">
            +₹250
          </span>
        </div>
        <div className="flex items-center justify-between border-t border-[var(--color-border-soft)] pt-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-subtle)]">
            Amount due
          </span>
          <span className="text-sm font-semibold tabular-nums text-[var(--color-ink)]">
            ₹100
          </span>
        </div>
      </div>
    </div>
  );
}

function FloatingInvoiceCard() {
  return (
    <div
      className="subvia-float absolute -left-6 bottom-12 hidden w-56 rounded-2xl border border-[var(--color-border-soft)] bg-white p-4 shadow-[0_24px_60px_-30px_rgba(20,22,26,0.35)] lg:block"
      style={{ animation: "subvia-float 9s ease-in-out -2s infinite" }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-subtle)]">
            Invoice
          </p>
          <p className="mt-1 font-mono text-[11px] font-semibold text-[var(--color-ink)]">
            INV-2026-000123
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-positive-soft)] px-2 py-0.5 text-[10px] font-semibold text-[var(--color-positive)]">
          Paid
        </span>
      </div>
      <div className="mt-3 flex items-center gap-2 rounded-lg bg-[var(--color-surface)] px-2.5 py-2">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-positive)] text-white">
          <Check className="h-3 w-3" strokeWidth={3} />
        </span>
        <p className="text-[11px] font-medium text-[var(--color-ink)]">
          Payment successful
        </p>
      </div>
    </div>
  );
}

function Hero() {
  return (
    <section id="product" className="relative overflow-hidden">
      {/* Soft neutral glow — no strong accent wash */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 900px 620px at 15% -10%, rgba(148, 163, 184, 0.18), transparent 60%), radial-gradient(ellipse 900px 620px at 90% 0%, rgba(215, 242, 76, 0.10), transparent 60%)",
        }}
      />

      <div className="mx-auto max-w-7xl px-4 pb-20 pt-14 sm:px-6 sm:pt-20 lg:px-8 lg:pt-24">
        <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border-soft)] bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-muted)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" />
              Subscription billing, built right
            </span>

            <h1 className="font-display mt-6 text-4xl font-semibold leading-[1.05] tracking-tight text-[var(--color-ink)] sm:text-5xl lg:text-6xl">
              Subscriptions that handle the{" "}
              <span className="relative inline-block">
                <span className="relative z-10">billing lifecycle</span>
                <span
                  aria-hidden
                  className="absolute inset-x-0 bottom-1 -z-0 h-3 rounded-sm bg-[var(--color-accent)]/55"
                />
              </span>
              .
            </h1>

            <p className="mt-6 max-w-xl text-base leading-7 text-[var(--color-ink-muted)] sm:text-lg">
              Create plans, manage subscriptions, handle mid-cycle changes,
              generate invoices, and keep recurring billing consistent — all
              in one platform.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                to="/register"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[var(--color-surface-dark)] px-6 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:opacity-95"
              >
                Get started
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#lifecycle"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-[var(--color-border-strong)] bg-white px-6 text-sm font-semibold text-[var(--color-ink)] transition hover:-translate-y-0.5 hover:border-[var(--color-ink)]"
              >
                See how it works
              </a>
            </div>

            <p className="mt-5 text-xs text-[var(--color-ink-subtle)]">
              Multi-tenant · INR &amp; USD · Proration built in
            </p>
          </Reveal>

          <Reveal delay={120} className="relative">
            <div className="relative">
              <MockBrowser />
              <FloatingProrationCard />
              <FloatingInvoiceCard />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────
   Section 1 — Core value strip
   ───────────────────────────────────────────────────────────── */

const CORE_VALUE = [
  {
    icon: Repeat,
    title: "Subscription lifecycle",
    body: "Create, upgrade, downgrade and cancel subscriptions with explicit billing rules.",
  },
  {
    icon: Divide,
    title: "Prorated billing",
    body: "Calculate mid-cycle plan changes using unused and remaining plan value.",
  },
  {
    icon: FileText,
    title: "Invoice & payment flow",
    body: "Generate invoices and track successful or failed payment attempts.",
  },
  {
    icon: RefreshCw,
    title: "Recurring billing",
    body: "Process due subscriptions and continue the billing cycle automatically.",
  },
];

function CoreValue() {
  return (
    <section className="border-y border-[var(--color-border-soft)] bg-white/70">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <Reveal>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {CORE_VALUE.map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="flex flex-col rounded-2xl border border-[var(--color-border-soft)] bg-white p-5 shadow-[var(--shadow-soft)]"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-surface)] text-[var(--color-ink)] ring-1 ring-[var(--color-border-soft)]">
                  <Icon className="h-4 w-4" />
                </span>
                <p className="mt-4 text-sm font-semibold text-[var(--color-ink)]">
                  {title}
                </p>
                <p className="mt-1.5 text-xs leading-5 text-[var(--color-ink-muted)]">
                  {body}
                </p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────
   Shared section chrome
   ───────────────────────────────────────────────────────────── */

function FeatureHeader({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body: string;
}) {
  return (
    <div className="max-w-xl">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-ink-subtle)]">
        {eyebrow}
      </p>
      <h2 className="font-display mt-3 text-3xl font-semibold leading-tight tracking-tight text-[var(--color-ink)] sm:text-4xl">
        {title}
      </h2>
      <p className="mt-4 text-base leading-7 text-[var(--color-ink-muted)]">
        {body}
      </p>
    </div>
  );
}

function FeatureBullets({
  items,
}: {
  items: { title: string; body: string }[];
}) {
  return (
    <ul className="mt-7 space-y-4">
      {items.map((item) => (
        <li key={item.title} className="flex items-start gap-3">
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-dark)]">
            <Check className="h-3 w-3 text-white" strokeWidth={3} />
          </span>
          <div>
            <p className="text-sm font-semibold text-[var(--color-ink)]">
              {item.title}
            </p>
            <p className="mt-0.5 text-sm text-[var(--color-ink-muted)]">
              {item.body}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}

/* ─────────────────────────────────────────────────────────────
   Section 2 — Catalog
   ───────────────────────────────────────────────────────────── */

function PlanStructureCard() {
  return (
    <div className="rounded-3xl border border-[var(--color-border-soft)] bg-white p-6 shadow-[0_30px_60px_-40px_rgba(20,22,26,0.3)]">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-subtle)]">
            Plan
          </p>
          <p className="mt-1 text-lg font-semibold tracking-tight text-[var(--color-ink)]">
            Pro
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-positive-soft)] px-2.5 py-1 text-[11px] font-semibold text-[var(--color-positive)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-positive)]" />
          Active
        </span>
      </div>

      <div className="mt-5 flex items-baseline gap-1">
        <span className="text-3xl font-semibold tabular-nums tracking-tight text-[var(--color-ink)]">
          ₹999
        </span>
        <span className="text-sm text-[var(--color-ink-subtle)]">
          / month
        </span>
      </div>

      <div className="mt-6 space-y-3 border-t border-[var(--color-border-soft)] pt-5">
        <Row label="Billing interval" value="Monthly" />
        <Row label="Currency" value="INR" />
        <Row label="Status" value="Subscription active" />
        <Row label="Next billing" value="Oct 28, 2026" />
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-[var(--color-ink-muted)]">{label}</span>
      <span className="font-medium text-[var(--color-ink)]">{value}</span>
    </div>
  );
}

function FeatureCatalog() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
        <Reveal>
          <FeatureHeader
            eyebrow="Catalog"
            title="Create plans once. Let the billing lifecycle do the work."
            body="Define what you sell — services, plans, price, currency, and billing interval. Customers discover plans and subscribe. The rest of the billing lifecycle is handled by the platform."
          />
          <FeatureBullets
            items={[
              {
                title: "Services & plans",
                body: "Monthly or yearly billing. INR or USD. Activate or retire plans without breaking historical invoices.",
              },
              {
                title: "Customer subscriptions",
                body: "Each subscription records its plan, currency, price, and billing period at creation time.",
              },
              {
                title: "Renewal cycle",
                body: "Active subscriptions renew on their billing period without manual intervention.",
              },
            ]}
          />
        </Reveal>

        <Reveal delay={100} className="lg:pl-6">
          <PlanStructureCard />
        </Reveal>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────
   Section 3 — Plan changes / proration
   ───────────────────────────────────────────────────────────── */

function ProrationCard() {
  return (
    <div className="rounded-3xl border border-[var(--color-border-soft)] bg-white p-6 shadow-[0_30px_60px_-40px_rgba(20,22,26,0.3)]">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-subtle)]">
          Plan change
        </p>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-surface)] px-2.5 py-1 text-[11px] font-semibold text-[var(--color-ink-muted)]">
          <Repeat className="h-3 w-3" />
          Prorated
        </span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-[var(--color-border-soft)] p-3.5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-subtle)]">
            Current plan
          </p>
          <p className="mt-1 text-sm font-semibold text-[var(--color-ink)]">
            Starter
          </p>
          <p className="mt-0.5 text-xs tabular-nums text-[var(--color-ink-muted)]">
            ₹500 / month
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-3.5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-subtle)]">
            Upgrade to
          </p>
          <p className="mt-1 text-sm font-semibold text-[var(--color-ink)]">
            Pro
          </p>
          <p className="mt-0.5 text-xs tabular-nums text-[var(--color-ink-muted)]">
            ₹800 / month
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-3 border-t border-[var(--color-border-soft)] pt-5 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-[var(--color-ink-muted)]">
            Unused Starter value
          </span>
          <span className="font-semibold tabular-nums text-[var(--color-positive)]">
            −₹150
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[var(--color-ink-muted)]">
            Remaining Pro value
          </span>
          <span className="font-semibold tabular-nums text-[var(--color-ink)]">
            +₹250
          </span>
        </div>
        <div className="flex items-center justify-between border-t border-[var(--color-border-soft)] pt-3">
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-subtle)]">
            Amount due
          </span>
          <span className="text-lg font-semibold tabular-nums text-[var(--color-ink)]">
            ₹100
          </span>
        </div>
      </div>
    </div>
  );
}

function FeaturePlanChanges() {
  return (
    <section className="border-y border-[var(--color-border-soft)] bg-white">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <Reveal className="order-2 lg:order-1">
            <ProrationCard />
          </Reveal>

          <Reveal delay={100} className="order-1 lg:order-2">
            <FeatureHeader
              eyebrow="Plan changes"
              title="Plan changes shouldn't break the billing cycle."
              body="Subvia handles upgrades and scheduled downgrades as billing operations, not simple plan changes. Mid-cycle moves are recalculated from the exact change time."
            />
            <FeatureBullets
              items={[
                {
                  title: "Immediate upgrades",
                  body: "Effective the moment they're confirmed, prorated to the day using unused time and remaining plan value.",
                },
                {
                  title: "Scheduled downgrades",
                  body: "Applied automatically at the next renewal, with a scheduled-change record on the subscription.",
                },
                {
                  title: "Cancellation with credit",
                  body: "Immediate cancellation refunds unused time as account credit that applies to the next invoice.",
                },
              ]}
            />
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────
   Section 4 — Invoicing
   ───────────────────────────────────────────────────────────── */

function InvoiceCard() {
  return (
    <div className="rounded-3xl border border-[var(--color-border-soft)] bg-white p-6 shadow-[0_30px_60px_-40px_rgba(20,22,26,0.3)]">
      <div className="flex items-start justify-between border-b border-[var(--color-border-soft)] pb-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-subtle)]">
            Invoice
          </p>
          <p className="mt-1 font-mono text-sm font-semibold text-[var(--color-ink)]">
            INV-2026-000418
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-positive-soft)] px-2.5 py-1 text-[11px] font-semibold text-[var(--color-positive)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-positive)]" />
          Paid
        </span>
      </div>

      <p className="mt-4 text-[11px] text-[var(--color-ink-subtle)]">
        Billing period · Oct 1 – Oct 31, 2026
      </p>

      <div className="mt-4 space-y-2.5 text-xs">
        <div className="flex items-center justify-between text-[var(--color-ink-muted)]">
          <span>Pro plan · monthly</span>
          <span className="tabular-nums">₹999.00</span>
        </div>
        <div className="flex items-center justify-between text-[var(--color-ink-muted)]">
          <span>Credit applied</span>
          <span className="tabular-nums text-[var(--color-positive)]">
            −₹150.00
          </span>
        </div>
        <div className="flex items-center justify-between text-[var(--color-ink-muted)]">
          <span>Tax (18%)</span>
          <span className="tabular-nums">₹152.82</span>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-[var(--color-border-soft)] pt-4">
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-subtle)]">
          Total
        </span>
        <span className="text-lg font-semibold tabular-nums text-[var(--color-ink)]">
          ₹1,001.82
        </span>
      </div>
    </div>
  );
}

function FeatureInvoicing() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
        <Reveal>
          <FeatureHeader
            eyebrow="Invoices"
            title="Every billing change leaves a clear financial record."
            body="Subscriptions, plan changes and renewals produce structured invoices and payment records so customers can see exactly what they were charged for."
          />
          <FeatureBullets
            items={[
              {
                title: "Itemized invoices",
                body: "Every charge, credit and tax line is recorded with quantity, unit price and total.",
              },
              {
                title: "Tax-aware",
                body: "Per-business tax rate applied consistently to every invoice generated for that business.",
              },
              {
                title: "Payment attempts",
                body: "Successful and failed payment attempts are tracked separately against each invoice.",
              },
            ]}
          />
        </Reveal>

        <Reveal delay={100} className="lg:pl-6">
          <InvoiceCard />
        </Reveal>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────
   Section 5 — Billing reliability (dark, replaces integrations)
   ───────────────────────────────────────────────────────────── */

const RELIABILITY_FLOW = [
  { label: "Request", icon: ArrowRight },
  { label: "Transaction", icon: ShieldCheck },
  { label: "Invoice", icon: FileText },
  { label: "Payment", icon: CreditCard },
  { label: "Subscription update", icon: RefreshCw },
];

function BillingReliability() {
  return (
    <section className="border-y border-[var(--color-border-soft)] bg-[var(--color-surface-dark)] text-white">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <Reveal>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/50">
              Reliability
            </p>
            <h2 className="font-display mt-3 text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl">
              Billing needs more than CRUD.
            </h2>
            <p className="mt-4 max-w-lg text-base leading-7 text-white/60">
              Financial operations can be retried, triggered concurrently, or
              fail halfway through. Subvia uses transactions, idempotency and
              concurrency controls to keep billing state consistent.
            </p>

            <ul className="mt-7 space-y-4">
              {[
                {
                  title: "Idempotent operations",
                  body: "Every mutating request is safe to retry — the same key produces the same result.",
                },
                {
                  title: "Transaction-safe",
                  body: "Subscription, invoice and payment updates commit together or roll back together.",
                },
                {
                  title: "Concurrency control",
                  body: "Overlapping requests can't create duplicate subscriptions or double charges.",
                },
              ].map((item) => (
                <li key={item.title} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10">
                    <Check className="h-3 w-3 text-[var(--color-accent)]" strokeWidth={3} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {item.title}
                    </p>
                    <p className="mt-0.5 text-sm text-white/60">
                      {item.body}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={100}>
            <div className="rounded-3xl border border-white/10 bg-[#0f1115] p-6 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.8)] sm:p-8">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
                Billing flow
              </p>

              <ol className="mt-6 space-y-3">
                {RELIABILITY_FLOW.map(({ label, icon: Icon }, i) => (
                  <li key={label}>
                    <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-white/70">
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <span className="text-sm font-medium text-white/90">
                        {label}
                      </span>
                    </div>
                    {i < RELIABILITY_FLOW.length - 1 ? (
                      <div className="flex justify-center py-1.5">
                        <ArrowDown className="h-3.5 w-3.5 text-white/25" />
                      </div>
                    ) : null}
                  </li>
                ))}
              </ol>

              <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
                  Idempotency key
                </p>
                <p className="mt-1.5 font-mono text-[11px] text-white/70">
                  9f2a4c1e · same request → same operation
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────
   Section 6 — How it works (7-step lifecycle)
   ───────────────────────────────────────────────────────────── */

const LIFECYCLE_STEPS = [
  {
    n: "01",
    icon: Package2,
    title: "Create a service and plan",
    body: "Price, currency, and billing interval — monthly or yearly.",
  },
  {
    n: "02",
    icon: Users,
    title: "Customer subscribes",
    body: "A subscription is created with its billing period and status.",
  },
  {
    n: "03",
    icon: FileText,
    title: "Invoice is generated",
    body: "Itemized, tax-aware, and issued in a single currency.",
  },
  {
    n: "04",
    icon: CreditCard,
    title: "Payment succeeds or fails",
    body: "Every attempt is recorded against the invoice.",
  },
  {
    n: "05",
    icon: ShieldCheck,
    title: "Subscription becomes active",
    body: "Successful payment activates the subscription.",
  },
  {
    n: "06",
    icon: Divide,
    title: "Plan changes are prorated",
    body: "Unused value credited, new plan charged from the change date.",
  },
  {
    n: "07",
    icon: RefreshCw,
    title: "Due subscriptions renew",
    body: "The billing cycle continues on its own.",
  },
];

function HowItWorks() {
  return (
    <section
      id="lifecycle"
      className="border-y border-[var(--color-border-soft)] bg-white"
    >
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-ink-subtle)]">
              Lifecycle
            </p>
            <h2 className="font-display mt-3 text-3xl font-semibold tracking-tight text-[var(--color-ink)] sm:text-4xl">
              From plan to renewal.
            </h2>
            <p className="mt-4 text-base leading-7 text-[var(--color-ink-muted)]">
              Every subscription moves through the same seven stages.
              Subvia keeps each stage consistent, from the first invoice to
              the next renewal.
            </p>
          </div>
        </Reveal>

        <div className="mx-auto mt-14 max-w-3xl">
          <ol className="relative space-y-1">
            <span
              aria-hidden
              className="absolute bottom-6 left-[1.35rem] top-6 w-px bg-[var(--color-border-soft)]"
            />
            {LIFECYCLE_STEPS.map(({ n, icon: Icon, title, body }) => (
              <li key={n} className="relative flex items-start gap-5 py-3">
                <span className="relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[var(--color-border-soft)] bg-white text-xs font-bold text-[var(--color-ink)] shadow-[var(--shadow-soft)]">
                  {n}
                </span>
                <div className="flex-1 rounded-2xl border border-[var(--color-border-soft)] bg-white p-4 shadow-[var(--shadow-soft)]">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--color-surface)] text-[var(--color-ink-muted)]">
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <p className="text-sm font-semibold text-[var(--color-ink)]">
                      {title}
                    </p>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-[var(--color-ink-muted)]">
                    {body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────
   Section 7 — Multi-tenancy
   ───────────────────────────────────────────────────────────── */

function BusinessCard({ name }: { name: string }) {
  return (
    <div className="rounded-2xl border border-[var(--color-border-soft)] bg-white p-5 shadow-[var(--shadow-soft)]">
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-surface)] text-[var(--color-ink)]">
          <Building2 className="h-4 w-4" />
        </span>
        <p className="text-sm font-semibold text-[var(--color-ink)]">{name}</p>
      </div>
      <ul className="mt-4 space-y-1.5 text-xs text-[var(--color-ink-muted)]">
        {["Services", "Plans", "Customers", "Billing"].map((item) => (
          <li key={item} className="flex items-center gap-2">
            <ChevronRight className="h-3 w-3 text-[var(--color-ink-subtle)]" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function MultiTenancy() {
  return (
    <section id="platform" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <Reveal>
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-ink-subtle)]">
            Platform
          </p>
          <h2 className="font-display mt-3 text-3xl font-semibold tracking-tight text-[var(--color-ink)] sm:text-4xl">
            One platform. Multiple businesses. Isolated billing.
          </h2>
          <p className="mt-4 text-base leading-7 text-[var(--color-ink-muted)]">
            Subvia is designed as a multi-tenant platform where businesses
            manage their own services, plans, customers and billing records.
          </p>
        </div>
      </Reveal>

      <Reveal delay={100}>
        <div className="mt-14 flex flex-col items-center">
          {/* Subvia root */}
          <div className="rounded-full border border-[var(--color-border-soft)] bg-[var(--color-surface-dark)] px-5 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white">
            Subvia
          </div>

          {/* Connector */}
          <div className="mt-4 h-8 w-px bg-[var(--color-border-strong)]" />

          {/* Two tenants */}
          <div className="grid w-full max-w-3xl gap-6 sm:grid-cols-2">
            <div className="relative pt-4">
              <span
                aria-hidden
                className="absolute left-1/2 top-0 h-4 w-px -translate-x-1/2 bg-[var(--color-border-strong)]"
              />
              <BusinessCard name="Business A" />
            </div>
            <div className="relative pt-4">
              <span
                aria-hidden
                className="absolute left-1/2 top-0 h-4 w-px -translate-x-1/2 bg-[var(--color-border-strong)]"
              />
              <BusinessCard name="Business B" />
            </div>
          </div>

          <p className="mt-8 max-w-xl text-center text-sm leading-6 text-[var(--color-ink-muted)]">
            Each business is scoped to its own data. Customers, invoices, and
            credit ledgers never cross tenants.
          </p>
        </div>
      </Reveal>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────
   Section 8 — Final CTA
   ───────────────────────────────────────────────────────────── */

function FinalCta() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <Reveal>
        <div className="relative overflow-hidden rounded-3xl bg-[var(--color-surface-dark)] px-8 py-16 text-center shadow-[0_40px_90px_-50px_rgba(20,22,26,0.6)] sm:px-14 sm:py-20">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(ellipse 700px 500px at 15% 0%, rgba(215, 242, 76, 0.14), transparent 60%), radial-gradient(ellipse 700px 500px at 90% 100%, rgba(129, 140, 248, 0.14), transparent 60%)",
            }}
          />

          <div className="relative mx-auto max-w-2xl">
            <h2 className="font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Ready to simplify subscription billing?
            </h2>
            <p className="mt-4 text-base leading-7 text-white/60">
              Create plans, manage subscriptions and keep the billing
              lifecycle in sync.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                to="/register"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-[var(--color-surface-dark)] transition hover:-translate-y-0.5"
              >
                Get started
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#product"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-white/20 px-6 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/5"
              >
                View product
              </a>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────
   Footer
   ───────────────────────────────────────────────────────────── */

const FOOTER_COLUMNS = [
  {
    heading: "Product",
    links: [
      { label: "Catalog", href: "#product" },
      { label: "Lifecycle", href: "#lifecycle" },
      { label: "Platform", href: "#platform" },
    ],
  },
  {
    heading: "Account",
    links: [
      { label: "Log in", to: "/login" },
      { label: "Create account", to: "/register" },
      { label: "Workspace", to: "/workspace" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Privacy", href: "#" },
      { label: "Terms", href: "#" },
      { label: "Security", href: "#" },
    ],
  },
];

function Footer() {
  return (
    <footer className="border-t border-[var(--color-border-soft)] bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-10 sm:flex-row">
          <div className="max-w-xs">
            <Wordmark />
            <p className="mt-4 text-sm leading-6 text-[var(--color-ink-muted)]">
              Subscriptions. Simplified.
            </p>
            <p className="mt-2 text-xs leading-5 text-[var(--color-ink-subtle)]">
              A multi-tenant subscription and billing platform.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-x-12 gap-y-6 sm:grid-cols-3">
            {FOOTER_COLUMNS.map((col) => (
              <div key={col.heading}>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-subtle)]">
                  {col.heading}
                </p>
                <ul className="mt-3 space-y-2">
                  {col.links.map((link) =>
                    "to" in link ? (
                      <li key={link.label}>
                        <Link
                          to={link.to}
                          className="text-sm text-[var(--color-ink-muted)] transition hover:text-[var(--color-ink)]"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ) : (
                      <li key={link.label}>
                        <a
                          href={link.href}
                          className="text-sm text-[var(--color-ink-muted)] transition hover:text-[var(--color-ink)]"
                        >
                          {link.label}
                        </a>
                      </li>
                    ),
                  )}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-[var(--color-border-soft)] pt-6 sm:flex-row sm:items-center">
          <p className="text-xs text-[var(--color-ink-subtle)]">
            © {new Date().getFullYear()} Subvia. All rights reserved.
          </p>
          <p className="text-xs text-[var(--color-ink-subtle)]">
            Built with React, Express, PostgreSQL, and Prisma.
          </p>
        </div>
      </div>
    </footer>
  );
}

/* ─────────────────────────────────────────────────────────────
   Page
   ───────────────────────────────────────────────────────────── */

export function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--color-surface)] text-[var(--color-ink)]">
      <style>{`
        @keyframes subvia-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        @media (prefers-reduced-motion: reduce) {
          .subvia-float { animation: none !important; }
        }
      `}</style>

      <TopNav />
      <main>
        <Hero />
        <CoreValue />
        <FeatureCatalog />
        <FeaturePlanChanges />
        <FeatureInvoicing />
        <BillingReliability />
        <HowItWorks />
        <MultiTenancy />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}