import type { SupabaseClient } from "@supabase/supabase-js";

export const REPORT_KINDS = ["bug", "idea", "other"] as const;
export const REPORT_STATUSES = ["new", "in_progress", "done"] as const;
export const REPORT_MAX_LENGTH = 2000;

export type ReportKind = (typeof REPORT_KINDS)[number];
export type ReportStatus = (typeof REPORT_STATUSES)[number];

export type Report = {
  id: string;
  email: string | null;
  kind: ReportKind;
  message: string;
  status: ReportStatus;
  createdAt: string;
};

type ReportRow = {
  id: string;
  email: string | null;
  kind: ReportKind;
  message: string;
  status: ReportStatus;
  created_at: string;
};

export const REPORT_FIELDS = "id, email, kind, message, status, created_at";

export function toReport(row: ReportRow): Report {
  return {
    id: row.id,
    email: row.email,
    kind: row.kind,
    message: row.message,
    status: row.status,
    createdAt: row.created_at,
  };
}

export async function sendReport(supabase: SupabaseClient, kind: ReportKind, message: string) {
  const { error } = await supabase
    .from("feedback_reports")
    .insert({ kind, message: message.trim() });
  if (error) throw error;
}

export async function isAdmin(supabase: SupabaseClient) {
  const { data, error } = await supabase.rpc("is_admin");
  if (error) throw error;
  return data === true;
}

export async function listReports(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("feedback_reports")
    .select(REPORT_FIELDS)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data as ReportRow[]).map(toReport);
}

export async function loadAdminReports(supabase: SupabaseClient) {
  if (!(await isAdmin(supabase))) return null;
  return listReports(supabase);
}

export async function setReportStatus(supabase: SupabaseClient, id: string, status: ReportStatus) {
  const { error } = await supabase.from("feedback_reports").update({ status }).eq("id", id);
  if (error) throw error;
}

export async function deleteReport(supabase: SupabaseClient, id: string) {
  const { error } = await supabase.from("feedback_reports").delete().eq("id", id);
  if (error) throw error;
}

export function countByStatus(reports: Report[]) {
  return Object.fromEntries(
    REPORT_STATUSES.map((status) => [
      status,
      reports.filter((report) => report.status === status).length,
    ]),
  ) as Record<ReportStatus, number>;
}
