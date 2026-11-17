import { expect, it } from "vitest";
import { toFeedback, toTranscript } from "./history";

const rows = [
  { sequence: 3, kind: "session.created", created_at: "2026-11-17T10:00:00Z", data: {} },
  {
    sequence: 5,
    kind: "transcript.final",
    created_at: "2026-11-17T10:00:06Z",
    data: { role: "assistant", text: " Why this role? " },
  },
  {
    sequence: 8,
    kind: "transcript.final",
    created_at: "2026-11-17T10:00:20Z",
    data: { role: "user", text: "Because I like payments.", interrupted: false },
  },
  {
    sequence: 9,
    kind: "feedback.created",
    created_at: "2026-11-17T10:05:00Z",
    data: {
      payload: JSON.stringify({
        summary: "Clear start.",
        notes: [
          { kind: "work_on", title: "Be specific", quote: "Because", advice: "Name one.", line: 2 },
        ],
      }),
    },
  },
];

it("turns stored events into transcript lines timed from the start", () => {
  expect(toTranscript(rows, "2026-11-17T10:00:00Z")).toEqual([
    { id: "5", role: "assistant", text: "Why this role?", at: 6, interrupted: false },
    { id: "8", role: "user", text: "Because I like payments.", at: 20, interrupted: false },
  ]);
});

it("links stored feedback notes to their transcript line", () => {
  const feedback = toFeedback(rows);
  expect(feedback?.summary).toBe("Clear start.");
  expect(feedback?.notes[0].sequence).toBe(8);
  expect(toFeedback(rows.slice(0, 3))).toBeNull();
});
