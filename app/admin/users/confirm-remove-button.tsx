"use client";

type ConfirmRemoveButtonProps = {
  disabled?: boolean;
  userLabel: string;
};

export function ConfirmRemoveButton({ disabled = false, userLabel }: ConfirmRemoveButtonProps) {
  return (
    <button
      type="submit"
      disabled={disabled}
      onClick={(event) => {
        const ok = window.confirm(`Are you sure you want to remove access for ${userLabel}? This will remove their portal account access.`);
        if (!ok) event.preventDefault();
      }}
      className="h-11 w-full rounded-lg border border-red-400/30 bg-red-500/10 px-4 text-sm text-red-100/80 transition hover:border-red-300/60 disabled:cursor-not-allowed disabled:opacity-40"
    >
      Remove user
    </button>
  );
}
