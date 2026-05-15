"use client";

import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/browser";

export function LogoutButton() {
  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <button onClick={signOut} className="inline-flex items-center gap-2 rounded-xl border border-border bg-panel px-3 py-2 text-sm text-white/70 hover:border-accent/50 hover:text-white">
      <LogOut size={16} />
      Sign out
    </button>
  );
}
