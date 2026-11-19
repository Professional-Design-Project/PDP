import { afterEach, expect, it, vi } from "vitest";
import {
  fetchSession,
  fetchTranscript,
  HttpError,
  type TranscriptEvent,
  type VoiceSession,
} from "./api";

vi.mock("@/lib/supabase/client", () => ({ accessToken: vi.fn() }));

const session: VoiceSession = {
  id: "session-1",
  access_token: "session-token",
  signaling_url: "/v1/sessions/session-1/offer",
  ice_servers: [],
};

function event(sequence: number): TranscriptEvent {
  return {
    sequence,
    timestamp: "2026-11-19T12:00:00Z",
    data: { role: "user", text: "Answer", interrupted: false },
  };
}

afterEach(() => vi.unstubAllGlobals());

it("loads all transcript pages using the event cursor and session authorization", async () => {
  const first = Array.from({ length: 500 }, (_, index) => event(index * 2 + 2));
  const last = [event(1004)];
  const fetch = vi
    .fn()
    .mockResolvedValueOnce(Response.json(first))
    .mockResolvedValueOnce(Response.json(last));
  vi.stubGlobal("fetch", fetch);
  const signal = new AbortController().signal;
  expect(await fetchTranscript(session, signal)).toEqual([...first, ...last]);
  expect(fetch).toHaveBeenCalledTimes(2);
  expect(fetch.mock.calls[0][0]).toContain("/transcript?after=0&limit=500");
  expect(fetch.mock.calls[1][0]).toContain("/transcript?after=1000&limit=500");
  for (const [, options] of fetch.mock.calls) {
    expect(options.headers.Authorization).toBe("Bearer session-token");
    expect(options.signal).toBe(signal);
  }
});

it("does not return a partial transcript when a later page fails", async () => {
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValueOnce(
        Response.json(Array.from({ length: 500 }, (_, index) => event(index + 1))),
      )
      .mockResolvedValueOnce(Response.json({ code: "internal_error" }, { status: 500 })),
  );
  await expect(fetchTranscript(session, new AbortController().signal)).rejects.toBeInstanceOf(
    HttpError,
  );
});

it("rejects a non-advancing transcript cursor", async () => {
  const page = Array.from({ length: 500 }, () => event(1));
  vi.stubGlobal(
    "fetch",
    vi.fn().mockImplementation(async () => Response.json(page)),
  );
  await expect(fetchTranscript(session, new AbortController().signal)).rejects.toThrow(
    "cursor did not advance",
  );
});

it("loads persisted session state without caching it", async () => {
  const saved = { status: "failed", end_reason: "transport_failed" };
  const fetch = vi.fn().mockResolvedValue(Response.json(saved));
  vi.stubGlobal("fetch", fetch);
  const signal = new AbortController().signal;
  expect(await fetchSession(session, signal)).toEqual(saved);
  expect(fetch.mock.calls[0][0]).toContain("/sessions/session-1");
  expect(fetch.mock.calls[0][1].signal).toBe(signal);
  expect(fetch.mock.calls[0][1].cache).toBe("no-store");
});
