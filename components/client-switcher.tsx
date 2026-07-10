"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Client, Profile } from "@/lib/types";

const SWITCHER_EMAILS = new Set(["ryanskonovaloff@gmail.com"]);

export function ClientSwitcher({
  currentClient,
  clients,
  profile,
  variant = "title"
}: {
  currentClient: Client | null;
  clients: Client[];
  profile: Pick<Profile, "email" | "role">;
  variant?: "title" | "badge";
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLSpanElement>(null);
  const canSwitch = profile.role === "admin" && SWITCHER_EMAILS.has(profile.email.toLowerCase()) && clients.length > 1;
  const label = currentClient?.name ?? "No client selected";

  useEffect(() => {
    if (!open) return;

    function closeOnOutsideClick(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  if (!canSwitch) {
    return <span>{label}</span>;
  }

  return (
    <span ref={menuRef} className="relative inline-flex max-w-full align-middle">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "inline-flex max-w-full items-center gap-2 rounded-lg text-left transition hover:text-accent focus:outline-none focus:ring-2 focus:ring-accent/35",
          variant === "badge"
            ? "border border-border bg-panelStrong px-2.5 py-1 text-xs font-medium text-white/75"
            : "font-semibold text-white"
        )}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span className="truncate">{label}</span>
        <ChevronDown size={variant === "badge" ? 13 : 20} className={cn("shrink-0 transition", open && "rotate-180")} />
      </button>

      {open ? (
        <span
          role="menu"
          className="absolute left-0 top-full z-50 mt-2 min-w-64 overflow-hidden rounded-xl border border-white/12 bg-[#101010] p-1.5 text-sm shadow-[0_24px_80px_rgba(0,0,0,0.58)]"
        >
          {clients.map((client) => {
            const active = client.id === currentClient?.id;
            return (
              <a
                key={client.id}
                role="menuitem"
                href={`/admin/clients/select?client=${client.slug}`}
                className={cn(
                  "flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-white/72 transition hover:bg-accent/12 hover:text-white",
                  active && "bg-accent/15 text-white"
                )}
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium">{client.name}</span>
                  <span className="block truncate text-xs text-white/40">{client.industry ?? client.slug}</span>
                </span>
                {active ? <Check size={15} className="shrink-0 text-accent" /> : null}
              </a>
            );
          })}
        </span>
      ) : null}
    </span>
  );
}
