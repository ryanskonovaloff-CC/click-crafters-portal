"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { KeyRound } from "lucide-react";
import { createClient } from "@/lib/supabase/browser";

const MIN_PASSWORD_LENGTH = 8;

export function UpdatePasswordForm({ recoveryAllowed }: { recoveryAllowed: boolean }) {
  const supabase = useMemo(() => createClient(), []);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [hasSession, setHasSession] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;

    async function checkSession() {
      const { data, error } = await supabase.auth.getUser();
      if (!active) {
        return;
      }

      setHasSession(recoveryAllowed && Boolean(data.user) && !error);
      setCheckingSession(false);
    }

    checkSession();

    return () => {
      active = false;
    };
  }, [recoveryAllowed, supabase]);

  async function updatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setMessage(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    await supabase.auth.signOut();
    window.location.href = "/login?message=password-updated";
  }

  if (checkingSession) {
    return <p className="rounded-xl border border-border bg-panel p-3 text-sm text-white/70">Checking reset link...</p>;
  }

  if (!hasSession) {
    return (
      <div className="space-y-4">
        <p className="rounded-xl border border-border bg-panel p-3 text-sm text-white/70">
          This password reset link is invalid or has expired.
        </p>
        <Link href="/login" className="inline-flex w-full items-center justify-center rounded-xl bg-accent px-4 py-3 font-semibold text-black hover:bg-orange-400">
          Return to login
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={updatePassword} className="space-y-4">
      <label className="block">
        <span className="text-sm text-white/60">New password</span>
        <input className="mt-2 w-full rounded-xl border border-border bg-black/30 px-3 py-3 text-white outline-none focus:border-accent/70" type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} minLength={MIN_PASSWORD_LENGTH} required />
      </label>
      <label className="block">
        <span className="text-sm text-white/60">Confirm new password</span>
        <input className="mt-2 w-full rounded-xl border border-border bg-black/30 px-3 py-3 text-white outline-none focus:border-accent/70" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} minLength={MIN_PASSWORD_LENGTH} required />
      </label>
      {message ? <p className="rounded-xl border border-border bg-panel p-3 text-sm text-white/70">{message}</p> : null}
      <button disabled={loading} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 font-semibold text-black hover:bg-orange-400 disabled:opacity-60">
        <KeyRound size={17} />
        {loading ? "Updating..." : "Update password"}
      </button>
    </form>
  );
}
