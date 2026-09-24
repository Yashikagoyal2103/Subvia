import type { LucideIcon } from "lucide-react";

interface Bullet {
  icon: LucideIcon;
  title: string;
  description: string;
}

interface AuthBrandPanelProps {
  headline: string;
  supporting: string;
  bullets: Bullet[];
}

export function AuthBrandPanel({
  headline,
  supporting,
  bullets,
}: AuthBrandPanelProps) {
  return (
    <aside className="relative hidden overflow-hidden bg-[var(--color-surface-dark)] p-12 text-white lg:flex lg:flex-col lg:justify-between">
      {/* Atmospheric glow */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 -top-32 h-[480px] w-[480px] rounded-full bg-[var(--color-accent)]/20 blur-3xl" />
        <div className="absolute -bottom-40 -right-24 h-[420px] w-[420px] rounded-full bg-indigo-500/25 blur-3xl" />
        <div className="absolute inset-0 opacity-[0.05] [background-image:linear-gradient(rgba(255,255,255,0.6)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.6)_1px,transparent_1px)] [background-size:32px_32px]" />
      </div>

      {/* Brand */}
      <div className="relative flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-accent)] text-[13px] font-bold text-[var(--color-accent-foreground)]">
          SB
        </span>
        <span className="text-sm font-semibold tracking-tight">
          SaaS Billing
        </span>
      </div>

      {/* Copy */}
      <div className="relative max-w-md">
        <h2 className="text-3xl font-semibold leading-tight tracking-tight text-white">
          {headline}
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-white/60">
          {supporting}
        </p>

        <ul className="mt-10 space-y-5">
          {bullets.map(({ icon: Icon, title, description }) => (
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
      </div>

      <p className="relative text-xs text-white/40">
        © {new Date().getFullYear()} SaaS Billing Platform
      </p>
    </aside>
  );
}