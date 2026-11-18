import type { SupabaseClient } from "@supabase/supabase-js";
import {
  defaultStyle,
  snapStyleValue,
  styleRanges,
  type InterviewStyle,
  type StyleKey,
} from "@/lib/interview-style";
import { scenarioIds, type ScenarioId } from "@/lib/scenarios";

export const PRESET_PARAM = "again";

export type PracticePreset = {
  scenarioId: ScenarioId;
  language: "pl" | "en";
  context: string;
  style: InterviewStyle;
  createdAt: string;
};

type PresetRow = {
  scenario_id: string;
  language: string;
  context: string | null;
  created_at: string;
};

export function presetStyle(data: Record<string, unknown> | undefined): InterviewStyle {
  const keys = Object.keys(styleRanges) as StyleKey[];
  return Object.fromEntries(
    keys.map((key) => {
      const value = data?.[key];
      return [key, typeof value === "number" ? snapStyleValue(key, value) : defaultStyle[key]];
    }),
  ) as InterviewStyle;
}

export function toPreset(
  row: PresetRow | null,
  created: Record<string, unknown> | undefined,
): PracticePreset | null {
  if (!row || !scenarioIds.includes(row.scenario_id as ScenarioId)) return null;
  if (row.language !== "pl" && row.language !== "en") return null;
  return {
    scenarioId: row.scenario_id as ScenarioId,
    language: row.language,
    context: row.context ?? "",
    style: presetStyle(created),
    createdAt: row.created_at,
  };
}

export async function loadPreset(supabase: SupabaseClient, id: string) {
  const [session, events] = await Promise.all([
    supabase
      .from("practice_sessions")
      .select("scenario_id, language, context, created_at")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("session_events")
      .select("data")
      .eq("session_id", id)
      .eq("kind", "session.created")
      .limit(1),
  ]);
  if (session.error) throw session.error;
  if (events.error) throw events.error;
  const created = (events.data?.[0] as { data?: Record<string, unknown> } | undefined)?.data;
  return toPreset(session.data as PresetRow | null, created);
}
