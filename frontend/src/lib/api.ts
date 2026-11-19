import type { ConsentChoices } from "@/lib/consent";
import type { DocumentKind } from "@/lib/documents";
import type { InterviewStyle } from "@/lib/interview-style";
import type { FeedbackResult } from "@/components/session/session-state";
import { accessToken } from "@/lib/supabase/client";

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/v1";

export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code?: string,
  ) {
    super(`Request failed (${status})`);
  }
}

export type VoiceSession = {
  id: string;
  access_token: string;
  signaling_url: string;
  ice_servers: RTCIceServer[];
};

export type SessionSnapshot = {
  status: "created" | "connecting" | "active" | "ended" | "failed";
  started_at: string | null;
  ended_at: string | null;
  end_reason: string | null;
};

export type TranscriptEvent = {
  sequence: number;
  timestamp: string;
  data: { role: "user" | "assistant"; text: string; interrupted: boolean };
};

export type NewSession = {
  scenario_id: string;
  language: string;
  context: string;
  consent: ConsentChoices & { version: string; language: string };
  documents: { name: string; kind: DocumentKind; text: string }[];
  style: InterviewStyle;
};

function url(path: string) {
  return path.startsWith("/v1") ? new URL(path, API_URL).toString() : `${API_URL}${path}`;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(url(path), {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    const code =
      body && typeof body === "object" && "code" in body && typeof body.code === "string"
        ? body.code
        : undefined;
    throw new HttpError(response.status, code);
  }
  return response.json() as Promise<T>;
}

async function userHeaders(): Promise<Record<string, string>> {
  const token = await accessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function bearer(session: VoiceSession) {
  return { Authorization: `Bearer ${session.access_token}` };
}

export async function createSession(body: NewSession) {
  return request<VoiceSession>("/sessions", {
    method: "POST",
    headers: await userHeaders(),
    body: JSON.stringify(body),
  });
}

export function endSession(session: VoiceSession) {
  return request<SessionSnapshot>(`/sessions/${session.id}/end`, {
    method: "POST",
    headers: bearer(session),
    signal: AbortSignal.timeout(25000),
  });
}

export function fetchSession(session: VoiceSession, signal: AbortSignal) {
  return request<SessionSnapshot>(`/sessions/${session.id}`, {
    headers: bearer(session),
    cache: "no-store",
    signal,
  });
}

export async function fetchTranscript(session: VoiceSession, signal: AbortSignal) {
  const events: TranscriptEvent[] = [];
  let after = 0;
  while (true) {
    const page = await request<TranscriptEvent[]>(
      `/sessions/${session.id}/transcript?after=${after}&limit=500`,
      { headers: bearer(session), cache: "no-store", signal },
    );
    events.push(...page);
    if (page.length < 500) return events;
    const next = page[page.length - 1].sequence;
    if (next <= after) throw new Error("Transcript cursor did not advance");
    after = next;
  }
}

export function sendOffer(session: VoiceSession, sdp: string | undefined) {
  return request<{ type: RTCSdpType; sdp: string }>(session.signaling_url, {
    method: "POST",
    headers: bearer(session),
    body: JSON.stringify({ type: "offer", sdp }),
  });
}

export function fetchFeedback(session: VoiceSession) {
  return request<FeedbackResult>(`/sessions/${session.id}/feedback`, {
    method: "POST",
    headers: bearer(session),
  });
}

export async function extractDocument(file: File) {
  const body = new FormData();
  body.append("file", file);
  const response = await fetch(url("/documents/extract"), {
    method: "POST",
    headers: await userHeaders(),
    body,
  });
  if (!response.ok) throw new HttpError(response.status);
  return (await response.json()) as { text: string; truncated: boolean };
}
