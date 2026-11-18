import type { SupabaseClient } from "@supabase/supabase-js";
import { SESSION_FIELDS, type SessionRow } from "@/lib/history";
import type { ScenarioId } from "@/lib/scenarios";

export const PROGRESS_SESSIONS = 30;
export const TIMELINE_LENGTH = 6;

export type ScenarioFilter = ScenarioId | "all";

export type ProgressEvent = {
  session_id: string;
  kind: string;
  data: Record<string, unknown>;
};

export type ProgressTotals = {
  sessions: number;
  seconds: number;
  answers: number;
  wordsPerAnswer: number;
};

export type ProgressStep = {
  id: string;
  scenarioId: ScenarioId;
  createdAt: string;
  strengths: string[];
  workOn: string[];
};

export type ProgressData = { sessions: SessionRow[]; events: ProgressEvent[] };

function seconds(row: SessionRow) {
  if (!row.started_at || !row.ended_at) return 0;
  return Math.max(0, Math.round((Date.parse(row.ended_at) - Date.parse(row.started_at)) / 1000));
}

function words(text: unknown) {
  return typeof text === "string" ? text.trim().split(/\s+/).filter(Boolean).length : 0;
}

function feedbackTitles(event: ProgressEvent | undefined) {
  if (!event || typeof event.data.payload !== "string") return null;
  try {
    const payload = JSON.parse(event.data.payload) as {
      notes?: { kind?: string; title?: string }[];
    };
    const notes = payload.notes ?? [];
    const titles = (kind: string) =>
      notes.filter((note) => note.kind === kind && note.title).map((note) => String(note.title));
    return { strengths: titles("strength"), workOn: titles("work_on") };
  } catch {
    return null;
  }
}

function practised(data: ProgressData, filter: ScenarioFilter) {
  return data.sessions.filter(
    (row) => row.started_at && (filter === "all" || row.scenario_id === filter),
  );
}

export function progressTotals(data: ProgressData, filter: ScenarioFilter): ProgressTotals {
  const sessions = practised(data, filter);
  const ids = new Set(sessions.map((row) => row.id));
  const answers = data.events.filter(
    (event) =>
      ids.has(event.session_id) &&
      event.kind === "transcript.final" &&
      event.data.role === "user" &&
      words(event.data.text) > 0,
  );
  const totalWords = answers.reduce((sum, event) => sum + words(event.data.text), 0);
  return {
    sessions: sessions.length,
    seconds: sessions.reduce((sum, row) => sum + seconds(row), 0),
    answers: answers.length,
    wordsPerAnswer: answers.length ? Math.round(totalWords / answers.length) : 0,
  };
}

export function progressTimeline(data: ProgressData, filter: ScenarioFilter): ProgressStep[] {
  const steps: ProgressStep[] = [];
  for (const row of practised(data, filter)) {
    const feedback = [...data.events]
      .reverse()
      .find((event) => event.session_id === row.id && event.kind === "feedback.created");
    const titles = feedbackTitles(feedback);
    if (!titles) continue;
    steps.push({ id: row.id, scenarioId: row.scenario_id, createdAt: row.created_at, ...titles });
    if (steps.length === TIMELINE_LENGTH) break;
  }
  return steps;
}

export function practisedScenarios(data: ProgressData): ScenarioId[] {
  return [...new Set(practised(data, "all").map((row) => row.scenario_id))];
}

export async function loadProgress(supabase: SupabaseClient): Promise<ProgressData> {
  const { data, error } = await supabase
    .from("practice_sessions")
    .select(SESSION_FIELDS)
    .in("status", ["ended", "failed"])
    .order("created_at", { ascending: false })
    .limit(PROGRESS_SESSIONS);
  if (error) throw error;
  const sessions = (data ?? []) as SessionRow[];
  if (!sessions.length) return { sessions, events: [] };
  const result = await supabase
    .from("session_events")
    .select("session_id, kind, data")
    .in(
      "session_id",
      sessions.map((row) => row.id),
    )
    .in("kind", ["transcript.final", "feedback.created"])
    .order("sequence");
  if (result.error) throw result.error;
  return { sessions, events: (result.data ?? []) as ProgressEvent[] };
}
