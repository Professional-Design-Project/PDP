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
  return request(`/sessions/${session.id}/end`, { method: "POST", headers: bearer(session) });
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
