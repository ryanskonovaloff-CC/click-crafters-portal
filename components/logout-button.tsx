"use client";

import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils";

export function LogoutButton({ className, collapsed = false }: { className?: string; collapsed?: boolean }) {
  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <button
      onClick={signOut}
      title={collapsed ? "Sign out" : undefined}
      className={cn("inline-flex items-center gap-2 rounded-xl border border-border bg-panel px-3 py-2 text-sm text-white/70 hover:border-accent/50 hover:text-white", className)}
    >
      <LogOut size={16} />
      <span className={cn(collapsed && "lg:hidden")}>Sign out</span>
    </button>
  );
}
