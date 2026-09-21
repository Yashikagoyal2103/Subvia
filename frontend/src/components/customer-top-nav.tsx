import { Link, useLocation } from "react-router-dom";
import { AppLogo } from "./app-logo";
import { LogoutButton } from "./auth/LogoutButton";
import { cn } from "../lib/utils";
import { Menu, X, ChevronDown, UserRound, ArrowUpRight, Zap } from "lucide-react";
import { useState } from "react";

interface CustomerTopNavProps {
  businessId: string;
}

export function CustomerTopNav({ businessId }: CustomerTopNavProps) {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const base = `/customer/${businessId}`;

  const mainNav = [
    { label: "Dashboard", href: `${base}/dashboard` },
    { label: "Services", href: `${base}/services` },
    { label: "Subscriptions", href: `${base}/subscriptions` },
    { label: "Invoices", href: `${base}/invoices` },
  ];

  const moreNav = [
    { label: "Credits", href: `${base}/credits` },
    { label: "Billing History", href: `${base}/billing` },
  ];

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/60 bg-white/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60">
      <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-10">
        
        <div className="flex items-center gap-10">
          <Link to={base} className="flex items-center gap-3 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-sm shadow-indigo-200 transition-transform group-hover:scale-105">
              <Zap className="h-5 w-5 fill-current" />
            </div>
            <span className="font-semibold tracking-tight text-slate-900 text-lg hidden sm:block">SaaS Billing</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100/50 border border-slate-200/50">
            {mainNav.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "relative rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 ease-out",
                    active 
                      ? "bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200/50" 
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}

            <div
              className="relative"
              onMouseEnter={() => setIsMoreOpen(true)}
              onMouseLeave={() => setIsMoreOpen(false)}
            >
              <button
                className={cn(
                  "flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 ease-out",
                  moreNav.some((n) => isActive(n.href))
                    ? "bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200/50"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                )}
              >
                More
                <ChevronDown className="h-3.5 w-3.5 opacity-70" />
              </button>

              {isMoreOpen && (
                <div className="absolute left-0 top-full pt-2">
                  <div className="w-48 overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 backdrop-blur-sm p-1.5 shadow-xl shadow-slate-900/5 animate-in fade-in slide-in-from-top-2 duration-200">
                    {moreNav.map((item) => (
                      <Link
                        key={item.href}
                        to={item.href}
                        className={cn(
                          "block rounded-xl px-4 py-2.5 text-sm font-medium transition-colors",
                          isActive(item.href) ? "bg-indigo-50/80 text-indigo-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        )}
                        onClick={() => setIsMoreOpen(false)}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </nav>
        </div>

        <div className="hidden items-center gap-4 md:flex">
          <Link
            to="/workspace"
            className="group flex items-center gap-2 rounded-full border border-slate-200/80 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition-all hover:border-indigo-200 hover:text-indigo-600"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1" />
            Switch context 
          </Link>

          <div className="w-px h-6 bg-slate-200/80" />

          <div
            className="relative"
            onMouseEnter={() => setIsProfileOpen(true)}
            onMouseLeave={() => setIsProfileOpen(false)}
          >
            <button className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200/80 bg-white text-slate-500 shadow-sm transition-all hover:border-indigo-300 hover:text-indigo-600 hover:shadow-md">
              <UserRound className="h-4 w-4" />
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 top-full pt-2">
                <div className="w-64 overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 backdrop-blur-sm p-1.5 shadow-xl shadow-slate-900/5 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-3 mb-1 bg-slate-50/50 rounded-xl">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-500">Account</p>
                    <p className="text-sm font-semibold text-slate-900 mt-1">Customer Workspace</p>
                    <p className="text-xs text-slate-500 truncate mt-0.5">{businessId}</p>
                  </div>
                  <Link
                    to={`/admin/${businessId}/dashboard`}
                    className="flex items-center justify-between rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
                  >
                    Go to Admin View <ArrowUpRight className="h-3.5 w-3.5 text-slate-400" />
                  </Link>
                  <div className="my-1 h-px bg-slate-100" />
                  <div className="px-1.5 py-1">
                    <LogoutButton />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <button
          className="text-slate-500 hover:text-slate-900 md:hidden p-2 -mr-2"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {isMobileMenuOpen && (
        <div className="border-t border-slate-200 bg-white/95 backdrop-blur-xl md:hidden animate-in slide-in-from-top-2">
          <div className="space-y-1 p-4">
            {[...mainNav, ...moreNav].map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "block rounded-xl px-4 py-3 text-base font-medium transition-colors",
                  isActive(item.href)
                    ? "bg-indigo-50/80 text-indigo-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <div className="my-4 h-px bg-slate-100" />
            <Link
              to="/workspace"
              className="block rounded-xl px-4 py-3 text-base font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Switch Workspace
            </Link>
            <Link
              to={`/admin/${businessId}/dashboard`}
              className="block rounded-xl px-4 py-3 text-base font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Admin View
            </Link>
            <div className="mt-4 px-2">
              <LogoutButton />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
