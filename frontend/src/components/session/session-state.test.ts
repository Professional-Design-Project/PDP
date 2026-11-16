import { expect, it } from "vitest";
import {
  endKind,
  formatClock,
  initialLiveState,
  liveReducer,
  type LiveState,
} from "./session-state";

function play(messages: { type: string; data?: Record<string, unknown> }[], start = 1000) {
  return messages.reduce<LiveState>(
    (state, message, index) =>
      liveReducer(state, { type: "message", message, now: start + index * 1000 }),
    initialLiveState,
  );
}

it("builds the live caption from spoken bot output", () => {
  const state = play([
    { type: "server-message", data: { kind: "session.ready" } },
    { type: "bot-started-speaking" },
    { type: "bot-output", data: { text: "Hello, and thank you ", spoken: true } },
    { type: "bot-output", data: { text: "for joining me today.", spoken: true } },
    { type: "bot-output", data: { text: "not yet", spoken: false } },
  ]);
  expect(state.readyAt).toBe(1000);
  expect(state.botSpeaking).toBe(true);
  expect(state.botCaption).toBe("Hello, and thank you for joining me today.");
});

it("adds final transcript lines once, timed from the start", () => {
  const final = {
    type: "server-message",
    data: {
      kind: "transcript.final",
      sequence: 7,
      role: "assistant",
      text: " Tell me about you. ",
    },
  };
  const state = play([
    { type: "server-message", data: { kind: "session.ready" } },
    { type: "bot-stopped-speaking" },
    final,
    final,
  ]);
  expect(state.transcript).toEqual([
    { id: "7", role: "assistant", text: "Tell me about you.", at: 2, interrupted: false },
  ]);
});

it("tracks the user turn and clears the caption when it is final", () => {
  const speaking = play([
    { type: "user-started-speaking" },
    { type: "user-transcription", data: { text: "I led the migration", final: false } },
  ]);
  expect(speaking.userSpeaking).toBe(true);
  expect(speaking.userCaption).toBe("I led the migration");
  const done = liveReducer(speaking, {
    type: "message",
    now: 9000,
    message: {
      type: "server-message",
      data: { kind: "transcript.final", sequence: 9, role: "user", text: "I led the migration." },
    },
  });
  expect(done.userCaption).toBe("");
  expect(done.transcript.at(-1)?.role).toBe("user");
});

it("records why the session ended", () => {
  const state = play([
    { type: "bot-started-speaking" },
    { type: "server-message", data: { kind: "session.ended", reason: "session_timeout" } },
  ]);
  expect(state.ended).toEqual({ reason: "session_timeout", failed: false });
  expect(state.botSpeaking).toBe(false);
  expect(endKind("session_timeout", false)).toBe("timeout");
  expect(endKind("transport_failed", true)).toBe("dropped");
  expect(endKind("user_ended", false)).toBe("user");
});

it("formats the session clock", () => {
  expect(formatClock(0)).toBe("00:00");
  expect(formatClock(252)).toBe("04:12");
});
