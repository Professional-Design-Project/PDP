import { expect, it } from "vitest";
import { buildExport } from "./data-export";

it("puts every session with its own transcript into the export", () => {
  const data = buildExport(
    { id: "u1", email: "a@example.com", created_at: "2026-11-01T00:00:00Z" },
    { locale: "pl" },
    [{ id: 1, voice: true }],
    [
      {
        id: "s1",
        scenario_id: "oral-exam",
        language: "pl",
        status: "ended",
        created_at: "2026-11-17T10:00:00Z",
        started_at: "2026-11-17T10:00:00Z",
        ended_at: "2026-11-17T10:02:00Z",
        context: "Operating systems exam",
      },
      {
        id: "s2",
        scenario_id: "job-interview",
        language: "en",
        status: "failed",
        created_at: "2026-11-17T11:00:00Z",
        started_at: null,
        ended_at: null,
        context: "",
      },
    ],
    [
      {
        sequence: 4,
        session_id: "s1",
        kind: "transcript.final",
        created_at: "2026-11-17T10:00:30Z",
        data: { role: "user", text: "Hello" },
      },
    ],
    new Date("2026-11-17T12:00:00Z"),
  );
  expect(data.exportedAt).toBe("2026-11-17T12:00:00.000Z");
  expect(data.account).toEqual({
    id: "u1",
    email: "a@example.com",
    createdAt: "2026-11-01T00:00:00Z",
  });
  expect(data.sessions.map((session) => session.transcript.length)).toEqual([1, 0]);
  expect(data.sessions[0]).toMatchObject({
    id: "s1",
    duration: 120,
    context: "Operating systems exam",
    feedback: null,
  });
  expect(data.sessions[0].transcript[0]).toMatchObject({ role: "user", text: "Hello", at: 30 });
});
