import type { SupabaseClient } from "@supabase/supabase-js";
import type { FeedbackResult, TranscriptLine } from "@/components/session/session-state";
import type { ScenarioId } from "@/lib/scenarios";

export type PastSession = {
  id: string;
  scenarioId: ScenarioId;
  language: "pl" | "en";
  status: string;
  createdAt: string;
  duration: number;
};

export type PastSessionDetail = PastSession & {
  transcript: TranscriptLine[];
  feedback: FeedbackResult | null;
};

export type SessionRow = {
  id: string;
  scenario_id: ScenarioId;
  language: "pl" | "en";
  status: string;
  created_at: string;
  started_at: string | null;
  ended_at: string | null;
};

export type EventRow = {
  sequence: number;
  kind: string;
  created_at: string;
  data: Record<string, unknown>;
};

export const SESSION_FIELDS = "id, scenario_id, language, status, created_at, started_at, ended_at";

function seconds(from: string | null, to: string | null) {
  if (!from || !to) return 0;
  return Math.max(0, Math.round((Date.parse(to) - Date.parse(from)) / 1000));
}

export function toPastSession(row: SessionRow): PastSession {
  return {
    id: row.id,
    scenarioId: row.scenario_id,
    language: row.language,
    status: row.status,
    createdAt: row.created_at,
    duration: seconds(row.started_at, row.ended_at),
  };
}

export function toTranscript(rows: EventRow[], startedAt: string | null): TranscriptLine[] {
  return rows
    .filter((row) => row.kind === "transcript.final" && typeof row.data.text === "string")
    .map((row) => ({
      id: String(row.sequence),
      role: row.data.role === "user" ? "user" : "assistant",
      text: String(row.data.text).trim(),
      at: seconds(startedAt, row.created_at),
      interrupted: row.data.interrupted === true,
    }));
}

export function toFeedback(rows: EventRow[]): FeedbackResult | null {
  const event = [...rows].reverse().find((row) => row.kind === "feedback.created");
  if (!event || typeof event.data.payload !== "string") return null;
  const payload = JSON.parse(event.data.payload) as {
    summary: string;
    notes: {
      kind: "strength" | "work_on";
      title: string;
      quote: string;
      advice: string;
      line: number;
    }[];
  };
  const lines = rows.filter((row) => row.kind === "transcript.final");
  return {
    summary: payload.summary,
    notes: payload.notes.map((note) => ({
      kind: note.kind,
      title: note.title,
      quote: note.quote,
      advice: note.advice,
      sequence: lines[note.line - 1]?.sequence ?? null,
    })),
  };
}

export async function listSessions(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("practice_sessions")
    .select(SESSION_FIELDS)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data as SessionRow[]).map(toPastSession);
}

export async function loadSession(supabase: SupabaseClient, id: string) {
  const { data: session, error } = await supabase
    .from("practice_sessions")
    .select(SESSION_FIELDS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!session) return null;
  const { data: events, error: eventsError } = await supabase
    .from("session_events")
    .select("sequence, kind, created_at, data")
    .eq("session_id", id)
    .order("sequence");
  if (eventsError) throw eventsError;
  const row = session as SessionRow;
  const rows = events as EventRow[];
  const detail: PastSessionDetail = {
    ...toPastSession(row),
    transcript: toTranscript(rows, row.started_at),
    feedback: toFeedback(rows),
  };
  return detail;
}

export async function deleteSession(supabase: SupabaseClient, id: string) {
  const { data, error } = await supabase
    .from("practice_sessions")
    .delete()
    .eq("id", id)
    .select("id");
  if (error) throw error;
  if (!data?.length) throw new Error("Session was not deleted");
}
