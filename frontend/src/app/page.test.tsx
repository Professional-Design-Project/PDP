import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import Home from "@/app/page";

it("renders the conversation controls", () => {
  render(<Home />);
  const scenario = screen.getByLabelText("Scenario");
  const language = screen.getByLabelText("Conversation language");
  const context = screen.getByLabelText("Additional context");
  expect(scenario).toBeEnabled();
  expect(context).toHaveAttribute("maxlength", "2000");
  expect(language).toHaveValue("pl");
  expect(screen.getByRole("button", { name: "Start conversation" })).toBeEnabled();
});

afterEach(() => vi.unstubAllGlobals());

it("checks and selects microphones, then releases the stream", async () => {
  const stop = vi.fn();
  const getUserMedia = vi.fn().mockResolvedValue({
    getTracks: () => [{ stop }],
    getAudioTracks: () => [{ getSettings: () => ({ deviceId: "one" }) }],
  });
  vi.stubGlobal("navigator", {
    mediaDevices: {
      getUserMedia,
      enumerateDevices: vi.fn().mockResolvedValue([
        { kind: "audioinput", deviceId: "one", label: "First mic" },
        { kind: "audioinput", deviceId: "two", label: "Second mic" },
      ]),
    },
  });
  render(<Home />);
  fireEvent.click(screen.getByRole("button", { name: "Check microphone" }));
  expect(await screen.findByText("Microphone available")).toBeInTheDocument();
  expect(stop).toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText("Microphone"), { target: { value: "two" } });
  fireEvent.click(screen.getByRole("button", { name: "Check microphone" }));
  await waitFor(() =>
    expect(getUserMedia).toHaveBeenLastCalledWith({ audio: { deviceId: { exact: "two" } } }),
  );
  expect(await screen.findByText("Microphone available")).toBeInTheDocument();
});

it("shows when microphone permission is denied", async () => {
  vi.stubGlobal("navigator", {
    mediaDevices: {
      getUserMedia: vi.fn().mockRejectedValue(new DOMException("Denied", "NotAllowedError")),
      enumerateDevices: vi.fn(),
    },
  });
  render(<Home />);
  fireEvent.click(screen.getByRole("button", { name: "Check microphone" }));
  expect(await screen.findByText("Microphone permission denied")).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Voice practice" })).toBeInTheDocument();
});
