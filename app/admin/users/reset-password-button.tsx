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
        const ok = window.confirm(`Reset the portal password for ${userLabel}? Share the new temporary password securely and have them change it after signing in.`);
        if (!ok) event.preventDefault();
      }}
      className="h-11 w-full rounded-lg border border-accent/50 bg-accent/15 px-4 text-sm font-medium text-accent transition hover:border-accent hover:bg-accent/20 disabled:cursor-wait disabled:opacity-60"
    >
      {pending ? "Resetting..." : "Reset password"}
    </button>
  );
}
