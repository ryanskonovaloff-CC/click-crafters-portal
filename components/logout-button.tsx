"use client";

import { LogOut } from "lucide-react";
import { useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils";

export function LogoutButton({ className, collapsed = false }: { className?: string; collapsed?: boolean }) {
  const [confirming, setConfirming] = useState(false);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <>
      <button
        onClick={() => setConfirming(true)}
        title={collapsed ? "Sign out" : undefined}
        className={cn("inline-flex items-center gap-2 rounded-xl border border-border bg-panel px-3 py-2 text-sm text-white/70 hover:border-accent/50 hover:text-white", className)}
      >
        <LogOut size={16} />
        <span className={cn(collapsed && "lg:hidden")}>Sign out</span>
      </button>

      {confirming ? (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-white/12 bg-[#0b0807] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.55)]">
            <h2 className="text-lg font-semibold text-white">Are you sure you want to log out?</h2>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setConfirming(false)} className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/75 hover:bg-white/10">No</button>
              <button type="button" onClick={signOut} className="rounded-lg border border-accent bg-accent px-4 py-2 text-sm font-semibold text-black hover:bg-accent/90">Yes</button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
