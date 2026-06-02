"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import { deleteMonthlyReport } from "./actions";

export function DeleteReportButton({ reportId, reportTitle }: { reportId: string; reportTitle: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-red-400/25 bg-red-500/10 px-3 py-2 text-sm font-medium text-red-100/75 transition hover:border-red-300/50 hover:bg-red-500/15 hover:text-red-50 sm:w-auto"
      >
        <Trash2 size={15} />
        Delete
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-md">
          <form action={deleteMonthlyReport} className="relative w-full max-w-md overflow-hidden rounded-xl border border-white/20 bg-[#080808] p-5 shadow-2xl shadow-black/50">
            <input type="hidden" name="reportId" value={reportId} />
            <DeleteDialogContent reportTitle={reportTitle} onCancel={() => setIsOpen(false)} />
          </form>
        </div>
      ) : null}
    </>
  );
}

function DeleteDialogContent({ reportTitle, onCancel }: { reportTitle: string; onCancel: () => void }) {
  const { pending } = useFormStatus();

  return (
    <>
      {pending ? (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-black/80 backdrop-blur-sm">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent/25 border-t-accent" />
          <p className="text-sm font-semibold text-white">Deleting report...</p>
        </div>
      ) : null}

      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-red-400/30 bg-red-500/10 text-red-100">
          <Trash2 size={18} />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Delete this report?</h3>
          <p className="mt-2 text-sm leading-6 text-white/60">
            This will permanently delete <span className="font-medium text-white/85">{reportTitle}</span>. This cannot be undone.
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          disabled={pending}
          className="inline-flex justify-center rounded-lg border border-white/15 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white/70 transition hover:border-white/25 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex justify-center rounded-lg border border-red-400/40 bg-red-500/15 px-4 py-2 text-sm font-semibold text-red-50 transition hover:border-red-300/60 hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Delete report
        </button>
      </div>
    </>
  );
}
