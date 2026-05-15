import Link from "next/link";
import type { ReactNode } from "react";
import { BarChart3, Building2, FileText, Gauge, Search, Settings, Shield, Users } from "lucide-react";
import type { Profile } from "@/lib/types";

const nav = [
  { href: "/dashboard", label: "Overview", icon: Gauge },
  { href: "/dashboard/paid-ads", label: "Paid Ads", icon: BarChart3 },
  { href: "/dashboard/seo", label: "SEO", icon: Search },
  { href: "/dashboard/reports", label: "Reports", icon: FileText },
  { href: "/dashboard/settings", label: "Settings", icon: Settings }
];

export function PortalShell({ profile, children }: { profile: Profile; children: ReactNode }) {
  return (
    <div className="relative z-10 min-h-screen lg:flex">
      <aside className="border-b border-border bg-black/30 px-4 py-4 backdrop-blur lg:fixed lg:inset-y-0 lg:left-0 lg:w-72 lg:border-b-0 lg:border-r lg:px-5">
        <div className="flex items-center justify-between gap-4 lg:block">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl border border-accent/40 bg-accentSoft text-accent">
              <Shield size={20} />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Click Crafters</p>
              <p className="text-xs text-white/50">Client Portal</p>
            </div>
          </Link>
          <div className="text-right text-xs text-white/50 lg:mt-8 lg:text-left">
            <p className="truncate text-white/75">{profile.full_name ?? profile.email}</p>
            <p className="capitalize">{profile.role.replace("_", " ")}</p>
          </div>
        </div>
        <nav className="mt-5 flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
          {nav.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className="inline-flex min-w-fit items-center gap-2 rounded-xl px-3 py-2 text-sm text-white/70 hover:bg-white/10 hover:text-white">
                <Icon size={16} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        {profile.role === "admin" ? (
          <div className="mt-4 border-t border-border pt-4">
            <p className="mb-2 px-3 text-xs uppercase tracking-[0.12em] text-white/40">Admin</p>
            <Link href="/admin/clients" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-white/70 hover:bg-white/10 hover:text-white">
              <Building2 size={16} />
              Clients
            </Link>
            <Link href="/admin/users" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-white/70 hover:bg-white/10 hover:text-white">
              <Users size={16} />
              Users
            </Link>
          </div>
        ) : null}
      </aside>
      <main className="w-full px-4 py-6 sm:px-6 lg:ml-72 lg:px-8">{children}</main>
    </div>
  );
}
