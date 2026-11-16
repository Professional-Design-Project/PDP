import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { LiveSession } from "./live-session";
import { initialLiveState, type LiveState } from "./session-state";

function renderSession(
  state: Partial<LiveState>,
  props: Partial<Parameters<typeof LiveSession>[0]> = {},
) {
  const handlers = { onToggleMute: vi.fn(), onEnd: vi.fn() };
  render(
    <LiveSession
      state={{ ...initialLiveState, ...state }}
      connected
      language="English"
      muted={false}
      ending={false}
      {...handlers}
      {...props}
    />,
  );
  return handlers;
}

it("shows the live caption while the interviewer speaks", () => {
  renderSession({ readyAt: Date.now(), botSpeaking: true, botCaption: "Tell me about yourself." });
  expect(screen.getByText("“Tell me about yourself.”")).toBeInTheDocument();
  expect(screen.getByText("Speaking")).toBeInTheDocument();
  expect(screen.getByText("AI interviewer, not a human")).toBeInTheDocument();
});

it("shows the user turn and wires the controls", () => {
  const handlers = renderSession({
    readyAt: Date.now(),
    userSpeaking: true,
    userCaption: "I led the migration",
  });
  expect(screen.getByText("I led the migration")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Mute microphone" }));
  expect(handlers.onToggleMute).toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "End the session" }));
  expect(handlers.onEnd).toHaveBeenCalled();
});

it("opens the transcript with finished turns", () => {
  renderSession({
    readyAt: Date.now(),
    transcript: [{ id: "1", role: "assistant", text: "Why this role?", at: 5, interrupted: false }],
  });
  fireEvent.click(screen.getByRole("button", { name: "Show transcript" }));
  expect(screen.getByRole("complementary", { name: "Transcript" })).toBeInTheDocument();
  expect(screen.getAllByText("Why this role?").length).toBeGreaterThan(0);
  expect(screen.getByText("00:05")).toBeInTheDocument();
});

it("says it is still connecting before the session is ready", () => {
  renderSession({}, { connected: false });
  expect(screen.getByText("Setting the room…")).toBeInTheDocument();
  expect(screen.getByText("Connecting")).toBeInTheDocument();
});
