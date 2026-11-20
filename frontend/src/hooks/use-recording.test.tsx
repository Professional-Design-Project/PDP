import { act, renderHook } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import type { VoiceSession } from "@/lib/api";
import { uploadRecording } from "@/lib/recordings";
import { useRecording } from "./use-recording";

vi.mock("@/lib/recordings", () => ({ uploadRecording: vi.fn() }));
vi.mock("@/lib/supabase/client", () => ({ browserClient: () => ({}) }));

const session: VoiceSession = {
  id: "session-1",
  access_token: "token",
  signaling_url: "",
  ice_servers: [],
};
const take = new Blob(["audio"], { type: "audio/webm" });

beforeEach(() => {
  vi.mocked(uploadRecording).mockReset();
  URL.createObjectURL = vi.fn(() => "blob:take");
  URL.revokeObjectURL = vi.fn();
});

it("saves right away when the user ticked the box before leaving", async () => {
  vi.mocked(uploadRecording).mockResolvedValue(undefined);
  const { result } = renderHook(() => useRecording());
  act(() => result.current.choose(true));
  await act(async () => result.current.receive(take, session));
  expect(uploadRecording).toHaveBeenCalledWith({}, "session-1", take);
  expect(result.current.recording).toEqual({ status: "saved", url: "blob:take" });
});

it("keeps the recording only on the device when the user did not tick the box", () => {
  const { result } = renderHook(() => useRecording());
  act(() => result.current.choose(false));
  act(() => result.current.receive(take, session));
  expect(uploadRecording).not.toHaveBeenCalled();
  expect(result.current.recording).toEqual({ status: "declined", url: "blob:take" });
});

it("offers to save after a session the interviewer ended", () => {
  const { result } = renderHook(() => useRecording());
  act(() => result.current.receive(take, session));
  expect(result.current.recording).toEqual({ status: "undecided", url: "blob:take" });
});

it("reports a failed upload and saves on retry", async () => {
  vi.mocked(uploadRecording).mockRejectedValueOnce(new Error("offline"));
  const { result } = renderHook(() => useRecording());
  act(() => result.current.receive(take, session));
  await act(() => result.current.save());
  expect(result.current.recording).toEqual({ status: "failed", url: "blob:take" });
  vi.mocked(uploadRecording).mockResolvedValueOnce(undefined);
  await act(() => result.current.save());
  expect(result.current.recording).toEqual({ status: "saved", url: "blob:take" });
});

it("forgets the recording and the choice on reset", () => {
  const { result } = renderHook(() => useRecording());
  act(() => result.current.choose(true));
  act(() => result.current.reset());
  act(() => result.current.receive(take, session));
  act(() => result.current.reset());
  expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:take");
  expect(result.current.recording).toEqual({ status: "none" });
  expect(uploadRecording).not.toHaveBeenCalled();
});
