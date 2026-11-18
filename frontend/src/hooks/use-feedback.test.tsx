import { act, renderHook } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { useFeedback } from "./use-feedback";

afterEach(() => vi.unstubAllGlobals());

it("passes the provider error from the HTTP response to the feedback state", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({ code: "feedback_provider_unavailable" }),
    }),
  );
  const { result } = renderHook(() => useFeedback());
  await act(() =>
    result.current.request({ id: "1", access_token: "token", signaling_url: "", ice_servers: [] }),
  );
  expect(result.current.feedback).toEqual({ status: "failed", reason: "provider_unavailable" });
});

it.each([
  ["feedback_unavailable", { status: "unavailable" }],
  ["session_conflict", { status: "failed", reason: "session_conflict" }],
  ["constructor", { status: "failed", reason: undefined }],
  ["unknown_code", { status: "failed", reason: undefined }],
])("handles a 409 with code %s", async (code, expected) => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({ ok: false, status: 409, json: async () => ({ code }) }),
  );
  const { result } = renderHook(() => useFeedback());
  await act(() =>
    result.current.request({ id: "1", access_token: "token", signaling_url: "", ice_servers: [] }),
  );
  expect(result.current.feedback).toEqual(expected);
});
