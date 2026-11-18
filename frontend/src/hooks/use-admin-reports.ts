"use client";

import { useState } from "react";
import { useSupabaseQuery } from "@/hooks/use-supabase-query";
import {
  deleteReport,
  loadAdminReports,
  setReportStatus,
  type Report,
  type ReportStatus,
} from "@/lib/reports";
import { browserClient } from "@/lib/supabase/client";

type Change = ReportStatus | "deleted";

function applyChanges(reports: Report[], changes: Record<string, Change>) {
  return reports.flatMap((report) => {
    const change = changes[report.id];
    if (change === "deleted") return [];
    return [change ? { ...report, status: change } : report];
  });
}

export function useAdminReports() {
  const { state } = useSupabaseQuery(loadAdminReports, "admin-reports");
  const [changes, setChanges] = useState<Record<string, Change>>({});
  const [failed, setFailed] = useState(false);

  const reports = state.status === "ready" && state.data ? applyChanges(state.data, changes) : null;

  async function apply(id: string, change: Change) {
    const supabase = browserClient();
    if (!supabase) return;
    setFailed(false);
    try {
      if (change === "deleted") await deleteReport(supabase, id);
      else await setReportStatus(supabase, id, change);
      setChanges((current) => ({ ...current, [id]: change }));
    } catch {
      setFailed(true);
    }
  }

  return {
    state,
    reports,
    failed,
    changeStatus: (id: string, status: ReportStatus) => apply(id, status),
    remove: (id: string) => apply(id, "deleted"),
  };
}
