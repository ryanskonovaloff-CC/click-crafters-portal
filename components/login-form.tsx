"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { Mail, Wand2 } from "lucide-react";
import { createClient } from "@/lib/supabase/browser";

export function LoginForm() {
  const supabase = createClient();
  const params = useSearchParams();
  const next = params.get("next") ?? "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    window.location.href = next;
  }

  async function magicLink() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` }
    });
    setLoading(false);
    setMessage(error ? error.message : "Magic link sent. Check your email.");
  }

  return (
    <form onSubmit={signIn} className="space-y-4">
      <label className="block">
        <span className="text-sm text-white/60">Email</span>
        <input className="mt-2 w-full rounded-xl border border-border bg-black/30 px-3 py-3 text-white outline-none focus:border-accent/70" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
      </label>
      <label className="block">
        <span className="text-sm text-white/60">Password</span>
        <input className="mt-2 w-full rounded-xl border border-border bg-black/30 px-3 py-3 text-white outline-none focus:border-accent/70" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
      </label>
      {message ? <p className="rounded-xl border border-border bg-panel p-3 text-sm text-white/70">{message}</p> : null}
      <button disabled={loading} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 font-semibold text-black hover:bg-orange-400 disabled:opacity-60">
        <Mail size={17} />
        {loading ? "Working..." : "Sign in"}
      </button>
      <button type="button" disabled={!email || loading} onClick={magicLink} className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-panel px-4 py-3 text-white/80 hover:border-accent/50 disabled:opacity-50">
        <Wand2 size={17} />
        Send magic link
      </button>
    </form>
  );
}
