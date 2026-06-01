"use client";

import { Trash2 } from "lucide-react";
import { deleteMonthlyReport } from "./actions";

export function DeleteReportButton({ reportId, reportTitle }: { reportId: string; reportTitle: string }) {
  return (
    <form
      action={deleteMonthlyReport}
      onSubmit={(event) => {
        const confirmed = window.confirm(`Delete "${reportTitle}"? This cannot be undone.`);
        if (!confirmed) event.preventDefault();
      }}
    >
      <input type="hidden" name="reportId" value={reportId} />
      <button
        type="submit"
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-red-400/25 bg-red-500/10 px-3 py-2 text-sm font-medium text-red-100/75 transition hover:border-red-300/50 hover:bg-red-500/15 hover:text-red-50 sm:w-auto"
      >
        <Trash2 size={15} />
        Delete
      </button>
    </form>
  );
}
