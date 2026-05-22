"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { BarChart3, Building2, FileText, Gauge, Menu, PanelLeftClose, PanelLeftOpen, Search, Settings, Users } from "lucide-react";
import type { Profile } from "@/lib/types";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/dashboard", label: "Overview", eyebrow: "Start here", icon: Gauge },
  { href: "/dashboard/paid-ads", label: "Paid Ads", eyebrow: "Media", icon: BarChart3 },
  { href: "/dashboard/seo", label: "SEO", eyebrow: "Organic", icon: Search },
  { href: "/dashboard/reports", label: "Reports", eyebrow: "Proof", icon: FileText },
  { href: "/dashboard/settings", label: "Settings", eyebrow: "Account", icon: Settings }
];

const adminNav = [
  { href: "/admin/clients", label: "Clients", eyebrow: "Accounts", icon: Building2 },
  { href: "/admin/users", label: "Users", eyebrow: "Access", icon: Users }
];

export function PortalShell({ profile, children }: { profile: Profile; children: ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("portal-sidebar-collapsed");
    setCollapsed(saved === "true");
  }, []);

  function toggleCollapsed() {
    setCollapsed((value) => {
      window.localStorage.setItem("portal-sidebar-collapsed", String(!value));
      return !value;
    });
  }

  return (
    <div className="relative z-10 min-h-screen">
      <div className="sticky top-0 z-40 border-b border-border bg-black/75 px-4 py-2 backdrop-blur lg:hidden">
        <button type="button" onClick={() => setMobileOpen((value) => !value)} className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-2.5 py-1.5 text-sm text-white">
          <Menu size={16} />
          Menu
        </button>
      </div>

      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 border-r border-white/10 bg-[#090604]/95 backdrop-blur-xl transition-all duration-300",
        collapsed ? "lg:w-24" : "lg:w-80",
        mobileOpen ? "w-80 translate-x-0" : "w-80 -translate-x-full lg:translate-x-0"
      )}>
        <div className="flex h-full flex-col overflow-y-auto px-4 py-4 shadow-[35px_0_120px_rgba(255,106,26,0.08)] sm:px-5 sm:py-5">
          <div className={cn("flex items-center gap-4", collapsed && "lg:flex-col lg:justify-start lg:gap-3")}>
            <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="grid size-12 place-items-center rounded-2xl border border-accent/45 bg-black/45 shadow-[0_0_45px_rgba(255,106,26,0.18)] sm:size-14">
              <img src="/assets/logo-mark.svg" alt="" className="h-8 w-8 sm:h-9 sm:w-9" aria-hidden="true" />
            </Link>
            <div className={cn("min-w-0 transition", collapsed && "lg:hidden")}>
              <img src="/assets/primary-logo.svg" alt="Click Crafters" className="h-8 w-auto max-w-[220px]" />
              <p className="text-sm font-semibold text-white/45">Client Portal</p>
            </div>
            <button
              type="button"
              onClick={toggleCollapsed}
              className={cn(
                "ml-auto hidden rounded-lg border border-white/10 p-2 text-white/55 hover:text-white lg:inline-flex",
                collapsed && "lg:ml-0"
              )}
            >
              {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            </button>
          </div>

          <div className={cn("mt-7 sm:mt-10", collapsed && "lg:hidden")}>
            <p className="truncate text-lg font-bold text-white/85">{profile.full_name ?? profile.email}</p>
            <p className="mt-1 text-sm capitalize text-white/45">{profile.role.replace("_", " ")}</p>
          </div>

          <nav className="mt-7 space-y-2 sm:mt-10 sm:space-y-3">
            {nav.map((item) => (
              <NavItem key={item.href} item={item} active={isActive(pathname, item.href)} collapsed={collapsed} onClick={() => setMobileOpen(false)} />
            ))}
          </nav>

          {profile.role === "admin" ? (
            <div className="mt-8 border-t border-white/10 pt-7">
              <p className={cn("mb-4 px-3 text-xs font-bold uppercase tracking-[0.22em] text-white/35", collapsed && "lg:hidden")}>Admin</p>
              <div className="space-y-3">
                {adminNav.map((item) => (
                  <NavItem key={item.href} item={item} active={isActive(pathname, item.href)} collapsed={collapsed} onClick={() => setMobileOpen(false)} />
                ))}
              </div>
            </div>
          ) : null}

          <div className={cn("mt-auto rounded-2xl border border-white/10 bg-white/[0.035] p-4", collapsed && "lg:hidden")}>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/38">Click Crafters</p>
            <p className="mt-3 text-sm leading-5 text-white/58">Clear reporting for marketing performance, revenue, and next steps.</p>
          </div>
        </div>
      </aside>

      {mobileOpen ? <button type="button" aria-label="Close menu" onClick={() => setMobileOpen(false)} className="fixed inset-0 z-40 bg-black/60 lg:hidden" /> : null}

      <main className={cn("min-w-0 overflow-x-hidden px-4 py-4 transition-all sm:px-6 sm:py-6 lg:px-8", collapsed ? "lg:ml-24" : "lg:ml-80")}>
        {children}
      </main>
    </div>
  );
}

function NavItem({ item, active, collapsed, onClick }: { item: typeof nav[number]; active: boolean; collapsed: boolean; onClick: () => void }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onClick}
      title={collapsed ? item.label : undefined}
      className={cn(
        "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-white/68 transition hover:bg-white/[0.06] hover:text-white sm:gap-4 sm:py-3",
        active && "bg-accentSoft text-white ring-1 ring-accent/25",
        collapsed && "lg:justify-center lg:px-0"
      )}
    >
      <Icon size={20} className={cn("shrink-0 sm:size-[22px]", active && "text-accent")} />
      <span className={cn("min-w-0 flex-1", collapsed && "lg:hidden")}>
        <span className="block text-base font-black tracking-tight sm:text-lg">{item.label}</span>
        <span className="block text-xs font-bold uppercase tracking-[0.18em] text-white/35 group-hover:text-white/45">{item.eyebrow}</span>
      </span>
    </Link>
  );
}

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}
