import type { SupabaseClient, User } from "@supabase/supabase-js";
import {
  SESSION_FIELDS,
  toFeedback,
  toPastSession,
  toTranscript,
  type EventRow,
  type SessionRow,
} from "@/lib/history";

type EventWithSession = EventRow & { session_id: string };

export function buildExport(
  user: Pick<User, "id" | "email" | "created_at">,
  profile: unknown,
  consents: unknown[],
  sessions: SessionRow[],
  events: EventWithSession[],
  exportedAt = new Date(),
) {
  return {
    exportedAt: exportedAt.toISOString(),
    account: { id: user.id, email: user.email ?? null, createdAt: user.created_at },
    profile,
    consents,
    sessions: sessions.map((session) => {
      const rows = events.filter((event) => event.session_id === session.id);
      return {
        ...toPastSession(session),
        startedAt: session.started_at,
        endedAt: session.ended_at,
        transcript: toTranscript(rows, session.started_at),
        feedback: toFeedback(rows),
      };
    }),
  };
}

export async function collectExport(supabase: SupabaseClient, user: User) {
  const [profile, consents, sessions] = await Promise.all([
    supabase.from("profiles").select("locale, created_at").maybeSingle(),
    supabase.from("consents").select("*").order("given_at"),
    supabase.from("practice_sessions").select(SESSION_FIELDS).order("created_at"),
  ]);
  const failure = profile.error ?? consents.error ?? sessions.error;
  if (failure) throw failure;
  const sessionRows = (sessions.data ?? []) as SessionRow[];
  let events: EventWithSession[] = [];
  if (sessionRows.length) {
    const result = await supabase
      .from("session_events")
      .select("sequence, session_id, kind, created_at, data")
      .in(
        "session_id",
        sessionRows.map((session) => session.id),
      )
      .order("sequence");
    if (result.error) throw result.error;
    events = result.data as EventWithSession[];
  }
  return buildExport(user, profile.data, consents.data ?? [], sessionRows, events);
}

export function downloadJson(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
