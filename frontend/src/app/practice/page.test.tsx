import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import Home from "@/app/practice/page";
import { resetConsentMemory } from "@/lib/consent";

it("renders the conversation controls", () => {
  render(<Home />);
  const scenario = screen.getByRole("radio", { name: /Job interview/ });
  const context = screen.getByLabelText("Additional context");
  expect(scenario).toBeEnabled();
  expect(scenario).toBeChecked();
  expect(context).toHaveAttribute("maxlength", "2000");
  expect(screen.getByRole("radio", { name: "English" })).toBeChecked();
  expect(screen.getByRole("button", { name: "Enter the room" })).toBeDisabled();
  expect(screen.getByText("You are talking to an AI.")).toBeInTheDocument();
});

it("switches the conversation language", () => {
  render(<Home />);
  fireEvent.click(screen.getByRole("radio", { name: "Polski" }));
  expect(screen.getByRole("radio", { name: "Polski" })).toBeChecked();
  expect(screen.getByRole("radio", { name: "English" })).not.toBeChecked();
});

afterEach(() => {
  vi.unstubAllGlobals();
  window.localStorage.clear();
  resetConsentMemory();
});

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
  expect(screen.getByRole("heading", { name: "Set the room." })).toBeInTheDocument();
});

it("lets the user choose another scenario", () => {
  render(<Home />);
  fireEvent.click(screen.getByRole("radio", { name: /Thesis defence/ }));
  expect(screen.getByRole("radio", { name: /Thesis defence/ })).toBeChecked();
  expect(screen.getByRole("radio", { name: /Job interview/ })).not.toBeChecked();
  expect(screen.getByLabelText("Additional context")).toHaveAttribute(
    "placeholder",
    expect.stringContaining("master's thesis"),
  );
});

it("requires the three required consents before entering", () => {
  window.localStorage.clear();
  resetConsentMemory();
  render(<Home />);
  const enter = screen.getByRole("button", { name: "Enter the room" });
  expect(enter).toBeDisabled();
  expect(screen.getByText("Tick the three required boxes to enter.")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("checkbox", { name: /voice being recorded/ }));
  fireEvent.click(screen.getByRole("checkbox", { name: /storage of transcripts/ }));
  expect(enter).toBeDisabled();
  fireEvent.click(screen.getByRole("checkbox", { name: /outside the European Union/ }));
  expect(enter).toBeEnabled();
  expect(screen.getByRole("checkbox", { name: /improve ensaio/ })).not.toBeChecked();
  expect(JSON.parse(window.localStorage.getItem("ensaio.consent") ?? "{}").choices.voice).toBe(
    true,
  );
});
