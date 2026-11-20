import { act, renderHook } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import type { VoiceSession } from "@/lib/api";
import { useEndDecision } from "./use-end-decision";

const session: VoiceSession = { id: "s", access_token: "t", signaling_url: "", ice_servers: [] };

function setup(canRecord = true) {
  const choose = { feedback: vi.fn(), recording: vi.fn() };
  const { result } = renderHook(() => useEndDecision(choose, canRecord));
  return { choose, result };
}

it("waits for a decision when the interviewer ended the conversation", () => {
  const { choose, result } = setup();
  act(() => result.current.finished(undefined, session));
  expect(result.current.undecided).toBe(true);
  act(() => result.current.decide({ feedback: false, recording: true }, session));
  expect(result.current.undecided).toBe(false);
  expect(choose.feedback).toHaveBeenLastCalledWith(false, session);
  expect(choose.recording).toHaveBeenCalledWith(true);
});

it("does not ask again after the user chose when leaving", () => {
  const { result } = setup();
  act(() => result.current.finished(true, session));
  expect(result.current.undecided).toBe(false);
});

it("never saves recordings for guests", () => {
  const { choose, result } = setup(false);
  act(() => result.current.finished(undefined, session));
  act(() => result.current.decide({ feedback: true, recording: true }, session));
  expect(choose.recording).not.toHaveBeenCalled();
});
