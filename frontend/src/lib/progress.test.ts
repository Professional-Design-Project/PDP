import { expect, it } from "vitest";
import type { SessionRow } from "@/lib/history";
import {
  practisedScenarios,
  progressTimeline,
  progressTotals,
  type ProgressData,
} from "@/lib/progress";

function session(id: string, scenario: SessionRow["scenario_id"], minutes: number | null) {
  return {
    id,
    scenario_id: scenario,
    language: "en",
    status: "ended",
    created_at: `2026-11-1${id}T10:00:00Z`,
    started_at: minutes === null ? null : "2026-11-18T10:00:00Z",
    ended_at: minutes === null ? null : `2026-11-18T10:${String(minutes).padStart(2, "0")}:00Z`,
  } satisfies SessionRow;
}

function feedback(sessionId: string, notes: { kind: string; title: string }[]) {
  return {
    session_id: sessionId,
    kind: "feedback.created",
    data: { payload: JSON.stringify({ summary: "ok", notes }) },
  };
}

const data: ProgressData = {
  sessions: [
    session("3", "oral-exam", 10),
    session("2", "job-interview", 5),
    session("1", "job-interview", null),
  ],
  events: [
    {
      session_id: "3",
      kind: "transcript.final",
      data: { role: "user", text: "one two three four" },
    },
    { session_id: "3", kind: "transcript.final", data: { role: "assistant", text: "a question" } },
    { session_id: "2", kind: "transcript.final", data: { role: "user", text: "yes" } },
    { session_id: "2", kind: "transcript.final", data: { role: "user", text: "  " } },
    { session_id: "1", kind: "transcript.final", data: { role: "user", text: "never started" } },
    feedback("3", [
      { kind: "strength", title: "Clear definitions" },
      { kind: "work_on", title: "Give an example" },
    ]),
    { session_id: "2", kind: "feedback.created", data: { payload: "not json" } },
  ],
};

it("counts only sessions that started, with their time, answers and words", () => {
  expect(progressTotals(data, "all")).toEqual({
    sessions: 2,
    seconds: 900,
    answers: 2,
    wordsPerAnswer: 3,
  });
  expect(progressTotals(data, "job-interview")).toEqual({
    sessions: 1,
    seconds: 300,
    answers: 1,
    wordsPerAnswer: 1,
  });
  expect(progressTotals({ sessions: [], events: [] }, "all").wordsPerAnswer).toBe(0);
});

it("lists feedback titles newest first and skips sessions without readable feedback", () => {
  expect(progressTimeline(data, "all")).toEqual([
    {
      id: "3",
      scenarioId: "oral-exam",
      createdAt: "2026-11-13T10:00:00Z",
      strengths: ["Clear definitions"],
      workOn: ["Give an example"],
    },
  ]);
  expect(progressTimeline(data, "job-interview")).toEqual([]);
});

it("names the scenarios that were practised", () => {
  expect(practisedScenarios(data)).toEqual(["oral-exam", "job-interview"]);
});
