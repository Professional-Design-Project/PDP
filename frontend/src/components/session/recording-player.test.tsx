import { act, fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { RecordingPlayer } from "@/components/session/recording-player";
import { LocaleProvider } from "@/i18n/locale";

function renderPlayer(initialDuration = Number.POSITIVE_INFINITY) {
  const { container } = render(
    <LocaleProvider locale="en">
      <RecordingPlayer src="blob:take" />
    </LocaleProvider>,
  );
  const audio = container.querySelector("audio")!;
  let duration = initialDuration;
  let currentTime = 0;
  let paused = true;
  Object.defineProperty(audio, "duration", { get: () => duration });
  Object.defineProperty(audio, "paused", { get: () => paused });
  Object.defineProperty(audio, "currentTime", {
    get: () => currentTime,
    set: (value: number) => {
      currentTime = value;
    },
  });
  audio.play = vi.fn(async () => {
    paused = false;
    fireEvent.play(audio);
  });
  audio.pause = vi.fn(() => {
    paused = true;
    fireEvent.pause(audio);
  });
  return {
    audio,
    slider: screen.getByRole("slider", { name: "Conversation recording" }),
    finish: (seconds: number) => {
      duration = seconds;
    },
  };
}

it("finds the real length of a recording without a stored duration, then rewinds", () => {
  const { audio, slider, finish } = renderPlayer();
  expect(slider).toBeDisabled();
  fireEvent.loadedMetadata(audio);
  expect(audio.currentTime).toBe(Number.MAX_SAFE_INTEGER);
  finish(73.4);
  fireEvent.durationChange(audio);
  expect(audio.currentTime).toBe(0);
  expect(screen.getByText("0:00 / 1:13")).toBeInTheDocument();
  expect(slider).toBeEnabled();
});

it("plays, pauses, follows the time and seeks with the blue slider", async () => {
  const { audio, slider } = renderPlayer(30);
  fireEvent.loadedMetadata(audio);
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Play the recording" }));
  });
  expect(audio.play).toHaveBeenCalled();
  audio.currentTime = 12;
  fireEvent.timeUpdate(audio);
  expect(screen.getByText("0:12 / 0:30")).toBeInTheDocument();
  expect(slider).toHaveStyle({ "--fill": "40%" });
  fireEvent.change(slider, { target: { value: "24" } });
  expect(audio.currentTime).toBe(24);
  fireEvent.click(screen.getByRole("button", { name: "Pause the recording" }));
  expect(audio.pause).toHaveBeenCalled();
  expect(screen.getByRole("button", { name: "Play the recording" })).toBeInTheDocument();
});
