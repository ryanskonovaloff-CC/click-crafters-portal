"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Mail, Wand2 } from "lucide-react";
import { createClient } from "@/lib/supabase/browser";

export function LoginForm() {
  const supabase = createClient();
  const params = useSearchParams();
  const next = getSafeNextPath(params.get("next"));
  const initialMessage = params.get("message") === "password-updated"
    ? "Your password has been updated. You can sign in with the new password."
    : "";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState(initialMessage);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"signin" | "reset">("signin");

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

  async function requestPasswordReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl}/auth/callback?next=/update-password`
    });

    setLoading(false);
    setMessage(error ? error.message : "If an account exists for that email, a reset link has been sent.");
  }

  if (mode === "reset") {
    return (
      <form onSubmit={requestPasswordReset} className="space-y-4">
        <label className="block">
          <span className="text-sm text-white/60">Email</span>
          <input className="mt-2 w-full rounded-xl border border-border bg-black/30 px-3 py-3 text-white outline-none focus:border-accent/70" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </label>
        {message ? <p className="rounded-xl border border-border bg-panel p-3 text-sm text-white/70">{message}</p> : null}
        <button disabled={loading} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 font-semibold text-black hover:bg-orange-400 disabled:opacity-60">
          <Mail size={17} />
          {loading ? "Sending..." : "Send reset link"}
        </button>
        <button type="button" onClick={() => { setMode("signin"); setMessage(initialMessage); }} className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-panel px-4 py-3 text-white/80 hover:border-accent/50">
          <ArrowLeft size={17} />
          Back to sign in
        </button>
      </form>
    );
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
      <button type="button" onClick={() => { setMode("reset"); setMessage(""); }} className="text-sm text-accent hover:text-orange-300">
        Forgot password?
      </button>
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

function getSafeNextPath(next: string | null) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/dashboard";
  }

  try {
    const parsed = new URL(next, "https://portal.clickcrafters.click");
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return "/dashboard";
  }
}
