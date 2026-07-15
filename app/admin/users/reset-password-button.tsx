"use client";

import { useFormStatus } from "react-dom";

type ResetPasswordButtonProps = {
  userLabel: string;
};

export function ResetPasswordButton({ userLabel }: ResetPasswordButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      onClick={(event) => {
        const ok = window.confirm(`Send a password reset email to ${userLabel}?`);
        if (!ok) event.preventDefault();
      }}
      className="h-11 w-full rounded-lg border border-border bg-panelStrong px-4 text-sm text-white/80 transition hover:border-accent/60 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
    >
      {pending ? "Sending..." : "Send reset link"}
    </button>
  );
}
