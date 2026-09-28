import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  CalendarClock,
  Check,
  ChevronRight,
  CreditCard,
  FileText,
  Layers,
  Menu,
  Package2,
  RefreshCw,
  Repeat,
  ShieldCheck,
  Sparkles,
  Webhook,
  X,
} from "lucide-react";
import { cn } from "cn";

/* ─────────────────────────────────────────────────────────────
   Scroll-reveal hook + wrapper
   ───────────────────────────────────────────────────────────── */

function useInView<T extends HTMLElement = HTMLDivElement>(threshold = 0.15) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof window === "undefined") return;

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

interface RevealProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

function Reveal({ children, delay = 0, className }: RevealProps) {
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
   Brand wordmark
   ───────────────────────────────────────────────────────────── */

function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--color-accent)] text-[13px] font-bold text-[var(--color-accent-foreground)]">
        S
      </span>
      <span className="text-sm font-semibold tracking-tight text-[var(--color-ink)]">
        Subvia
      </span>
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────
   Nav
   ───────────────────────────────────────────────────────────── */

const NAV_LINKS = [
  { label: "Product", href: "#product" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
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
            className="inline-flex h-9 items-center gap-2 rounded-full bg-[var(--color-accent)] px-4 text-sm font-semibold text-[var(--color-accent-foreground)] shadow-[var(--shadow-pill)] transition hover:brightness-105"
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
              className="rounded-full bg-[var(--color-accent)] px-4 py-2.5 text-center text-sm font-semibold text-[var(--color-accent-foreground)]"
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
   Hero mock — browser chrome + dashboard preview
   ───────────────────────────────────────────────────────────── */

function MockBrowser() {
  return (
    <div className="overflow-hidden rounded-3xl border border-[var(--color-border-soft)] bg-white shadow-[0_40px_90px_-50px_rgba(20,22,26,0.5)]">
      {/* Chrome bar */}
      <div className="flex items-center gap-2 border-b border-[var(--color-border-soft)] bg-[var(--color-surface)] px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-rose-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
        <span className="ml-3 truncate rounded-md bg-white px-3 py-1 text-[11px] text-[var(--color-ink-subtle)] ring-1 ring-[var(--color-border-soft)]">
          app.subvia.dev/dashboard
        </span>
      </div>

      {/* Dashboard body */}
      <div className="space-y-5 p-5">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-subtle)]">
              Acme Cloud
            </p>
            <p className="mt-1 text-sm font-semibold text-[var(--color-ink)]">
              Dashboard
            </p>
          </div>
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-surface-dark)] text-[10px] font-bold text-[var(--color-accent)]">
            A
          </span>
        </div>

        {/* Stat row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-3.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-subtle)]">
              Active subscriptions
            </p>
            <p className="mt-1.5 text-xl font-semibold tabular-nums text-[var(--color-ink)]">
              248
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-3.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-subtle)]">
              MRR
            </p>
            <p className="mt-1.5 text-xl font-semibold tabular-nums text-[var(--color-ink)]">
              ₹4.2L
            </p>
          </div>
        </div>

        {/* Mini chart */}
        <div className="rounded-2xl border border-[var(--color-border-soft)] p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-[var(--color-ink)]">
              Renewals
            </p>
            <p className="text-[10px] text-[var(--color-ink-subtle)]">
              Last 12 weeks
            </p>
          </div>
          <div className="mt-3 flex h-20 items-end gap-1.5">
            {[38, 52, 46, 60, 72, 58, 76, 82, 70, 88, 92, 96].map((h, i) => (
              <span
                key={i}
                className={cn(
                  "flex-1 rounded-t-sm",
                  i === 11
                    ? "bg-[var(--color-accent)]"
                    : i % 2 === 0
                      ? "bg-[var(--color-surface-dark)]"
                      : "bg-[var(--color-border-strong)]",
                )}
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>

        {/* Recent rows */}
        <div className="divide-y divide-[var(--color-border-soft)]">
          {[
            {
              name: "Acme Cloud · Pro plan",
              meta: "₹4,999/mo · ACTIVE",
              tone: "positive" as const,
            },
            {
              name: "Northwind · Starter",
              meta: "₹999/mo · ACTIVE",
              tone: "positive" as const,
            },
            {
              name: "Quanta · Scale",
              meta: "₹7,999/mo · PAST DUE",
              tone: "warning" as const,
            },
          ].map((row) => (
            <div
              key={row.name}
              className="flex items-center justify-between py-3"
            >
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--color-surface)] text-[10px] font-bold text-[var(--color-ink-muted)]">
                  {row.name.charAt(0)}
                </span>
                <p className="text-xs font-medium text-[var(--color-ink)]">
                  {row.name}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] tabular-nums text-[var(--color-ink-muted)]">
                  {row.meta}
                </span>
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    row.tone === "positive"
                      ? "bg-[var(--color-positive)]"
                      : "bg-[var(--color-warning)]",
                  )}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FloatingNextRenewal() {
  return (
    <div
      className="subvia-float absolute -right-4 top-8 hidden w-56 rounded-2xl border border-[var(--color-border-soft)] bg-white p-4 shadow-[0_24px_60px_-30px_rgba(20,22,26,0.35)] sm:block"
      style={{ animation: "subvia-float 7s ease-in-out infinite" }}
    >
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--color-accent-soft)] text-[var(--color-ink)]">
          <CalendarClock className="h-3.5 w-3.5" />
        </span>
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-subtle)]">
          Next renewal
        </p>
      </div>
      <p className="mt-3 text-sm font-semibold text-[var(--color-ink)]">
        Acme Cloud · Pro
      </p>
      <p className="mt-0.5 text-xs text-[var(--color-ink-muted)]">
        in 12 days · ₹4,999
      </p>
    </div>
  );
}

function FloatingProration() {
  return (
    <div
      className="subvia-float absolute -left-6 bottom-10 hidden w-60 rounded-2xl border border-[var(--color-border-soft)] bg-white p-4 shadow-[0_24px_60px_-30px_rgba(20,22,26,0.35)] sm:block"
      style={{ animation: "subvia-float 8.5s ease-in-out -2s infinite" }}
    >
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--color-accent-soft)] text-[var(--color-ink)]">
          <Repeat className="h-3.5 w-3.5" />
        </span>
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-subtle)]">
          Proration applied
        </p>
      </div>
      <p className="mt-3 text-xs text-[var(--color-ink-muted)]">
        Starter credit − ₹1,500
      </p>
      <p className="mt-1 text-xs text-[var(--color-ink-muted)]">
        Pro charge + ₹4,999
      </p>
      <p className="mt-2 border-t border-[var(--color-border-soft)] pt-2 text-sm font-semibold tabular-nums text-[var(--color-ink)]">
        Net due ₹3,499
      </p>
    </div>
  );
}

function Hero() {
  return (
    <section
      id="product"
      className="relative overflow-hidden"
    >
      {/* Soft accent glow (same pattern as .app-canvas) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 900px 620px at 12% -10%, rgba(215, 242, 76, 0.32), transparent 60%), radial-gradient(ellipse 900px 620px at 88% 0%, rgba(129, 140, 248, 0.14), transparent 60%)",
        }}
      />

      <div className="mx-auto max-w-7xl px-4 pb-20 pt-14 sm:px-6 sm:pt-20 lg:px-8 lg:pt-24">
        <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border-soft)] bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-muted)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" />
              Subscription billing, built-in
            </span>

            <h1 className="font-display mt-6 text-4xl font-semibold leading-[1.05] tracking-tight text-[var(--color-ink)] sm:text-5xl lg:text-6xl">
              Run subscriptions{" "}
              <span className="relative inline-block">
                <span className="relative z-10">without the busywork</span>
                <span
                  aria-hidden
                  className="absolute inset-x-0 bottom-1 -z-0 h-3 rounded-sm bg-[var(--color-accent)]/70"
                />
              </span>
              .
            </h1>

            <p className="mt-6 max-w-xl text-base leading-7 text-[var(--color-ink-muted)] sm:text-lg">
              Services, pricing plans, invoicing, automatic proration, a
              credit ledger, and signed webhooks — a real billing engine,
              ready on day one. You focus on the business.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                to="/register"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[var(--color-accent)] px-6 text-sm font-semibold text-[var(--color-accent-foreground)] shadow-[0_18px_40px_-20px_rgba(215,242,76,0.9)] transition hover:-translate-y-0.5 hover:brightness-105"
              >
                Get started
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-[var(--color-border-strong)] bg-white px-6 text-sm font-semibold text-[var(--color-ink)] transition hover:-translate-y-0.5 hover:border-[var(--color-ink)]"
              >
                See how it works
              </a>
            </div>

            <p className="mt-5 text-xs text-[var(--color-ink-subtle)]">
              Free tier available · No credit card required
            </p>
          </Reveal>

          <Reveal delay={120} className="relative">
            <div className="relative">
              <MockBrowser />
              <FloatingNextRenewal />
              <FloatingProration />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────
   Proof strip
   ───────────────────────────────────────────────────────────── */

const PROOF_CHIPS = [
  {
    icon: ShieldCheck,
    label: "Idempotent by default",
    detail: "Every mutation safe to retry",
  },
  {
    icon: Layers,
    label: "Multi-currency",
    detail: "INR and USD, never mixed",
  },
  {
    icon: Webhook,
    label: "Signed + retried webhooks",
    detail: "HMAC, timestamped, backoff",
  },
  {
    icon: RefreshCw,
    label: "Automatic proration",
    detail: "Recalculated to the day",
  },
];

function ProofStrip() {
  return (
    <section className="border-y border-[var(--color-border-soft)] bg-white/70">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <Reveal>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PROOF_CHIPS.map(({ icon: Icon, label, detail }) => (
              <div
                key={label}
                className="flex items-start gap-3 rounded-2xl border border-[var(--color-border-soft)] bg-white p-4 shadow-[var(--shadow-soft)]"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--color-accent-soft)] text-[var(--color-ink)]">
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[var(--color-ink)]">
                    {label}
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--color-ink-muted)]">
                    {detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────
   Shared feature section chrome
   ───────────────────────────────────────────────────────────── */

interface FeatureHeaderProps {
  eyebrow: string;
  title: string;
  body: string;
}

function FeatureHeader({ eyebrow, title, body }: FeatureHeaderProps) {
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

interface BulletProps {
  items: { title: string; body: string }[];
}

function FeatureBullets({ items }: BulletProps) {
  return (
    <ul className="mt-7 space-y-4">
      {items.map((item) => (
        <li key={item.title} className="flex items-start gap-3">
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent)]">
            <Check
              className="h-3 w-3 text-[var(--color-accent-foreground)]"
              strokeWidth={3}
            />
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
   Feature A — Plans that bill themselves
   ───────────────────────────────────────────────────────────── */

function PlanMockCard() {
  return (
    <div className="rounded-3xl border border-[var(--color-border-soft)] bg-white p-6 shadow-[0_30px_60px_-40px_rgba(20,22,26,0.35)]">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-subtle)]">
            Pro plan · Monthly
          </p>
          <p className="mt-2 text-3xl font-semibold tabular-nums tracking-tight text-[var(--color-ink)]">
            ₹4,999
            <span className="ml-1 text-sm font-normal text-[var(--color-ink-subtle)]">
              /mo
            </span>
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-positive-soft)] px-2.5 py-1 text-[11px] font-semibold text-[var(--color-positive)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-positive)]" />
          Active
        </span>
      </div>

      <div className="mt-6 space-y-2 border-t border-[var(--color-border-soft)] pt-5 text-xs text-[var(--color-ink-muted)]">
        <div className="flex items-center justify-between">
          <span>Billing interval</span>
          <span className="font-semibold text-[var(--color-ink)]">Monthly</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Currency</span>
          <span className="font-semibold text-[var(--color-ink)]">INR</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Next renewal</span>
          <span className="font-semibold text-[var(--color-ink)]">
            in 12 days
          </span>
        </div>
      </div>
    </div>
  );
}

function FeaturePlans() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
        <Reveal>
          <FeatureHeader
            eyebrow="Catalog"
            title="Plans that bill themselves."
            body="Create services, attach pricing plans, and let the engine handle the rest — billing cycles, renewal timing, and cross-currency math included."
          />
          <FeatureBullets
            items={[
              {
                title: "Services & plans",
                body: "Monthly or yearly. INR or USD. Activate or retire without breaking historical invoices.",
              },
              {
                title: "Automatic renewal",
                body: "Active subscriptions renew on their billing period without manual intervention.",
              },
              {
                title: "Scheduled downgrades",
                body: "Downgrades apply at the next renewal — never an abrupt mid-cycle price drop.",
              },
            ]}
          />
        </Reveal>

        <Reveal delay={100} className="lg:pl-6">
          <PlanMockCard />
        </Reveal>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────
   Feature B — Proration
   ───────────────────────────────────────────────────────────── */

function ProrationMathCard() {
  return (
    <div className="rounded-3xl border border-[var(--color-border-soft)] bg-white p-6 shadow-[0_30px_60px_-40px_rgba(20,22,26,0.35)]">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-subtle)]">
          Upgrade · Starter → Pro
        </p>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-accent-soft)] px-2.5 py-1 text-[11px] font-semibold text-[var(--color-ink)]">
          <Repeat className="h-3 w-3" />
          Prorated
        </span>
      </div>

      <div className="mt-6 space-y-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-[var(--color-ink-muted)]">
            Starter · unused time credit
          </span>
          <span className="font-semibold tabular-nums text-[var(--color-positive)]">
            − ₹1,500
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[var(--color-ink-muted)]">
            Pro · new plan charge
          </span>
          <span className="font-semibold tabular-nums text-[var(--color-ink)]">
            + ₹4,999
          </span>
        </div>
        <div className="flex items-center justify-between border-t border-[var(--color-border-soft)] pt-3">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-subtle)]">
            Net charged today
          </span>
          <span className="text-lg font-semibold tabular-nums text-[var(--color-ink)]">
            ₹3,499
          </span>
        </div>
      </div>

      <p className="mt-5 rounded-xl bg-[var(--color-surface)] px-3 py-2.5 text-[11px] leading-5 text-[var(--color-ink-muted)]">
        Recalculated to the day, tax added, invoice issued — automatically.
      </p>
    </div>
  );
}

function FeatureProration() {
  return (
    <section className="border-y border-[var(--color-border-soft)] bg-white">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <Reveal className="order-2 lg:order-1">
            <ProrationMathCard />
          </Reveal>

          <Reveal delay={100} className="order-1 lg:order-2">
            <FeatureHeader
              eyebrow="Lifecycle"
              title="Upgrades and downgrades that do the math for you."
              body="Mid-cycle changes recalculate cleanly. The engine credits unused time, charges the new plan from today, and issues an itemized invoice."
            />
            <FeatureBullets
              items={[
                {
                  title: "Immediate upgrades",
                  body: "Effective the moment they're confirmed, prorated to the day.",
                },
                {
                  title: "Scheduled downgrades",
                  body: "Applied automatically at the next renewal, with a scheduled-change audit entry.",
                },
                {
                  title: "Credit on immediate cancel",
                  body: "Unused time refunded as account credit and applied to the next invoice automatically.",
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
   Feature C — Invoicing
   ───────────────────────────────────────────────────────────── */

function InvoiceMockCard() {
  return (
    <div className="rounded-3xl border border-[var(--color-border-soft)] bg-white p-6 shadow-[0_30px_60px_-40px_rgba(20,22,26,0.35)]">
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

      <div className="mt-4 space-y-2.5 text-xs">
        <div className="flex items-center justify-between text-[var(--color-ink-muted)]">
          <span>Pro plan · monthly</span>
          <span className="tabular-nums">₹4,999.00</span>
        </div>
        <div className="flex items-center justify-between text-[var(--color-ink-muted)]">
          <span>Starter · unused time credit</span>
          <span className="tabular-nums text-[var(--color-positive)]">
            −₹1,500.00
          </span>
        </div>
        <div className="flex items-center justify-between text-[var(--color-ink-muted)]">
          <span>Tax (18%)</span>
          <span className="tabular-nums">₹629.82</span>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-[var(--color-border-soft)] pt-4">
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-subtle)]">
          Total
        </span>
        <span className="text-lg font-semibold tabular-nums text-[var(--color-ink)]">
          ₹4,128.82
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
            title="Invoicing that's actually correct."
            body="Itemized, tax-aware, and issued in a single currency per document. Human-readable sequential numbers. Historical invoices stay meaningful forever."
          />
          <FeatureBullets
            items={[
              {
                title: "Tax-aware by default",
                body: "Per-business tax rate applied to every invoice and itemized on the document.",
              },
              {
                title: "Credits auto-applied",
                body: "Available account credit reduces the invoice before anything is charged.",
              },
              {
                title: "Sequential numbers",
                body: "Readable, gap-free sequences you can hand to accounting.",
              },
            ]}
          />
        </Reveal>

        <Reveal delay={100} className="lg:pl-6">
          <InvoiceMockCard />
        </Reveal>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────
   Feature D — Integrations (dark code card)
   ───────────────────────────────────────────────────────────── */

const WEBHOOK_SAMPLE = `{
  "id": "evt_8a72b1",
  "type": "subscription.upgraded",
  "created_at": "2026-04-18T10:12:04Z",
  "data": {
    "subscription_id": "sub_9f2a",
    "from_plan": "Starter",
    "to_plan": "Pro",
    "proration": {
      "old_plan_credit": 150000,
      "new_plan_charge": 499900,
      "net_amount": 349900,
      "currency": "INR"
    }
  }
}`;

function FeatureIntegrations() {
  return (
    <section className="border-y border-[var(--color-border-soft)] bg-[var(--color-surface-dark)] text-white">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <Reveal>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/50">
              Integrations
            </p>
            <h2 className="font-display mt-3 text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl">
              Built for integrations, not just a dashboard.
            </h2>
            <p className="mt-4 max-w-lg text-base leading-7 text-white/60">
              Signed HMAC webhooks with automatic retry and exponential
              backoff. Scoped API keys for reading your live catalog. Every
              event is timestamped and safe to consume.
            </p>

            <ul className="mt-7 space-y-4">
              {[
                {
                  title: "Signed webhooks",
                  body: "HMAC-verified, timestamped deliveries you can trust.",
                },
                {
                  title: "Automatic retries",
                  body: "Failures retried with exponential backoff, indefinitely.",
                },
                {
                  title: "Scoped API keys",
                  body: "Issue and revoke keys for external catalog reads.",
                },
              ].map((item) => (
                <li key={item.title} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent)]">
                    <Check
                      className="h-3 w-3 text-[var(--color-accent-foreground)]"
                      strokeWidth={3}
                    />
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
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0f1115] shadow-[0_30px_80px_-40px_rgba(0,0,0,0.8)]">
              <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
                <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
                <span className="ml-3 font-mono text-[11px] text-white/40">
                  POST /webhooks/your-endpoint
                </span>
              </div>
              <pre className="overflow-x-auto p-5 font-mono text-[12px] leading-6 text-white/80">
                <code>{WEBHOOK_SAMPLE}</code>
              </pre>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────
   Two surfaces
   ───────────────────────────────────────────────────────────── */

const SURFACES = [
  {
    icon: BarChart3,
    title: "Admin dashboard",
    bullets: [
      "Services & pricing plans",
      "Customers & subscriptions",
      "Invoices & payments",
      "Billing activity audit trail",
      "Webhooks & API keys",
    ],
  },
  {
    icon: CreditCard,
    title: "Customer portal",
    bullets: [
      "Subscriptions with pending changes",
      "Invoices with line-item detail",
      "Credit balance per currency",
      "Full billing history",
    ],
  },
];

function TwoSurfaces() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <Reveal>
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-ink-subtle)]">
            Two surfaces
          </p>
          <h2 className="font-display mt-3 text-3xl font-semibold tracking-tight text-[var(--color-ink)] sm:text-4xl">
            One engine, two views.
          </h2>
          <p className="mt-4 text-base leading-7 text-[var(--color-ink-muted)]">
            Everything admins and customers need, backed by the same billing
            core — with strict tenant isolation between businesses.
          </p>
        </div>
      </Reveal>

      <div className="mt-14 grid gap-6 lg:grid-cols-2">
        {SURFACES.map(({ icon: Icon, title, bullets }, i) => (
          <Reveal key={title} delay={i * 80}>
            <div className="flex h-full flex-col rounded-3xl border border-[var(--color-border-soft)] bg-white p-8 shadow-[0_24px_60px_-40px_rgba(20,22,26,0.35)]">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--color-accent-soft)] text-[var(--color-ink)]">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="font-display mt-5 text-xl font-semibold tracking-tight text-[var(--color-ink)]">
                {title}
              </h3>
              <ul className="mt-5 space-y-2.5">
                {bullets.map((b) => (
                  <li
                    key={b}
                    className="flex items-center gap-2.5 text-sm text-[var(--color-ink-muted)]"
                  >
                    <ChevronRight className="h-3.5 w-3.5 text-[var(--color-ink-subtle)]" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────
   How it works
   ───────────────────────────────────────────────────────────── */

const STEPS = [
  {
    n: "01",
    icon: Package2,
    title: "Create a service & plan",
    body: "Set a name, price, currency, and billing interval. Add as many plans as you need per service.",
  },
  {
    n: "02",
    icon: FileText,
    title: "Customers subscribe",
    body: "Invoices, proration, tax, and credit application handled automatically at the moment of subscription.",
  },
  {
    n: "03",
    icon: RefreshCw,
    title: "It runs itself",
    body: "Renewals, retries, credit rollover, and webhook deliveries all execute on their own.",
  },
];

function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="border-y border-[var(--color-border-soft)] bg-white"
    >
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-ink-subtle)]">
              How it works
            </p>
            <h2 className="font-display mt-3 text-3xl font-semibold tracking-tight text-[var(--color-ink)] sm:text-4xl">
              From zero to first invoice in three steps.
            </h2>
          </div>
        </Reveal>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {STEPS.map(({ n, icon: Icon, title, body }, i) => (
            <Reveal key={n} delay={i * 100}>
              <div className="relative h-full rounded-3xl border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-7">
                <div className="flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-surface-dark)] text-xs font-bold text-[var(--color-accent)]">
                    {n}
                  </span>
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[var(--color-ink-muted)] ring-1 ring-[var(--color-border-soft)]">
                    <Icon className="h-4 w-4" />
                  </span>
                </div>
                <h3 className="mt-6 text-base font-semibold tracking-tight text-[var(--color-ink)]">
                  {title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-[var(--color-ink-muted)]">
                  {body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────
   Pricing
   ───────────────────────────────────────────────────────────── */

interface Tier {
  name: string;
  price: string;
  period: string;
  blurb: string;
  features: string[];
  cta: string;
  highlight?: boolean;
}

const TIERS: Tier[] = [
  {
    name: "Starter",
    price: "Free",
    period: "",
    blurb: "For trying out the billing engine.",
    features: [
      "1 business workspace",
      "Up to 3 services",
      "Manual invoicing",
      "Community support",
    ],
    cta: "Start free",
  },
  {
    name: "Growth",
    price: "₹2,499",
    period: "/mo",
    blurb: "For businesses running recurring revenue.",
    features: [
      "Unlimited services & plans",
      "Automatic renewal & retries",
      "Proration & credit ledger",
      "Signed webhooks with retries",
      "Scoped API keys",
      "Priority email support",
    ],
    cta: "Get started",
    highlight: true,
  },
  {
    name: "Scale",
    price: "₹7,999",
    period: "/mo",
    blurb: "For high-volume, multi-currency teams.",
    features: [
      "Everything in Growth",
      "Multi-currency tenants",
      "Higher volume limits",
      "Dedicated support channel",
    ],
    cta: "Contact us",
  },
];

function Pricing() {
  return (
    <section id="pricing" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      {/* TODO: placeholder pricing, confirm real tiers */}
      <Reveal>
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-ink-subtle)]">
            Pricing
          </p>
          <h2 className="font-display mt-3 text-3xl font-semibold tracking-tight text-[var(--color-ink)] sm:text-4xl">
            Choose your plan.
          </h2>
          <p className="mt-4 text-base leading-7 text-[var(--color-ink-muted)]">
            Simple month-to-month pricing. No seats, no usage surprises.
          </p>
        </div>
      </Reveal>

      <div className="mt-14 grid gap-6 lg:grid-cols-3">
        {TIERS.map((tier, i) => (
          <Reveal key={tier.name} delay={i * 80}>
            <div
              className={cn(
                "flex h-full flex-col rounded-3xl border p-7 transition",
                tier.highlight
                  ? "border-[var(--color-surface-dark)] bg-[var(--color-surface-dark)] text-white shadow-[0_40px_80px_-40px_rgba(20,22,26,0.5)] lg:-mt-4 lg:mb-4"
                  : "border-[var(--color-border-soft)] bg-white",
              )}
            >
              <div className="flex items-center justify-between">
                <h3
                  className={cn(
                    "text-lg font-semibold tracking-tight",
                    tier.highlight ? "text-white" : "text-[var(--color-ink)]",
                  )}
                >
                  {tier.name}
                </h3>
                {tier.highlight ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-accent)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--color-accent-foreground)]">
                    <Sparkles className="h-3 w-3" />
                    Popular
                  </span>
                ) : null}
              </div>

              <p
                className={cn(
                  "mt-1.5 text-sm",
                  tier.highlight ? "text-white/60" : "text-[var(--color-ink-muted)]",
                )}
              >
                {tier.blurb}
              </p>

              <div className="mt-6 flex items-baseline gap-1">
                <span
                  className={cn(
                    "text-4xl font-semibold tracking-tight tabular-nums",
                    tier.highlight ? "text-white" : "text-[var(--color-ink)]",
                  )}
                >
                  {tier.price}
                </span>
                {tier.period ? (
                  <span
                    className={cn(
                      "text-sm",
                      tier.highlight
                        ? "text-white/50"
                        : "text-[var(--color-ink-subtle)]",
                    )}
                  >
                    {tier.period}
                  </span>
                ) : null}
              </div>

              <ul className="mt-7 flex-1 space-y-3">
                {tier.features.map((f) => (
                  <li
                    key={f}
                    className={cn(
                      "flex items-start gap-2.5 text-sm",
                      tier.highlight
                        ? "text-white/85"
                        : "text-[var(--color-ink-muted)]",
                    )}
                  >
                    <Check
                      className={cn(
                        "mt-0.5 h-4 w-4 shrink-0",
                        tier.highlight
                          ? "text-[var(--color-accent)]"
                          : "text-[var(--color-positive)]",
                      )}
                    />
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                to="/register"
                className={cn(
                  "mt-8 inline-flex h-11 items-center justify-center gap-2 rounded-full text-sm font-semibold transition hover:-translate-y-0.5",
                  tier.highlight
                    ? "bg-[var(--color-accent)] text-[var(--color-accent-foreground)] hover:brightness-105"
                    : "border border-[var(--color-border-strong)] bg-white text-[var(--color-ink)] hover:border-[var(--color-ink)]",
                )}
              >
                {tier.cta}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────
   Testimonial (placeholder)
   ───────────────────────────────────────────────────────────── */

function Testimonial() {
  return (
    <section className="border-y border-[var(--color-border-soft)] bg-white">
      <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 lg:px-8">
        {/* TODO: replace with a real customer quote */}
        <Reveal>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-ink-subtle)]">
            Early adopters
          </p>
          <blockquote className="font-display mt-6 text-2xl font-medium leading-snug tracking-tight text-[var(--color-ink)] sm:text-3xl">
            “Proration and idempotency alone saved us weeks of engineering.
            We stopped building billing and started shipping the product.”
          </blockquote>
          <p className="mt-6 text-sm text-[var(--color-ink-muted)]">
            — Placeholder quote · replace with a real customer
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────
   Final CTA
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
                "radial-gradient(ellipse 700px 500px at 15% 0%, rgba(215, 242, 76, 0.22), transparent 60%), radial-gradient(ellipse 700px 500px at 90% 100%, rgba(129, 140, 248, 0.18), transparent 60%)",
            }}
          />

          <div className="relative mx-auto max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-accent)]">
              <Sparkles className="h-3.5 w-3.5" />
              Free tier available
            </span>

            <h2 className="font-display mt-5 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Ship your first subscription today.
            </h2>
            <p className="mt-4 text-base leading-7 text-white/60">
              Create a business, publish a plan, and watch invoices generate
              themselves.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                to="/register"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[var(--color-accent)] px-6 text-sm font-semibold text-[var(--color-accent-foreground)] transition hover:-translate-y-0.5 hover:brightness-105"
              >
                Get started free
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/login"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-white/20 px-6 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/5"
              >
                Log in
              </Link>
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
      { label: "Features", href: "#product" },
      { label: "How it works", href: "#how-it-works" },
      { label: "Pricing", href: "#pricing" },
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
              Subscription billing infrastructure for modern businesses.
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
            Built with React, TanStack Query, and Tailwind.
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
      {/* Continuous float keyframe for the hero mock cards */}
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
        <ProofStrip />
        <FeaturePlans />
        <FeatureProration />
        <FeatureInvoicing />
        <FeatureIntegrations />
        <TwoSurfaces />
        <HowItWorks />
        <Pricing />
        <Testimonial />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}