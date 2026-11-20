import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { RecordingPlayer } from "@/components/session/recording-player";
import { LocaleProvider } from "@/i18n/locale";

function renderPlayer() {
  render(
    <LocaleProvider locale="en">
      <RecordingPlayer src="blob:take" />
    </LocaleProvider>,
  );
  const audio = screen.getByLabelText("Conversation recording") as HTMLAudioElement;
  let duration = Number.POSITIVE_INFINITY;
  let currentTime = 0;
  Object.defineProperty(audio, "duration", { get: () => duration });
  Object.defineProperty(audio, "currentTime", {
    get: () => currentTime,
    set: (value: number) => {
      currentTime = value;
    },
  });
  return {
    audio,
    finish: (seconds: number) => {
      duration = seconds;
    },
  };
}

it("finds the real length of a recording without a stored duration, then rewinds", () => {
  const { audio, finish } = renderPlayer();
  fireEvent.loadedMetadata(audio);
  expect(audio.currentTime).toBe(Number.MAX_SAFE_INTEGER);
  finish(73.4);
  fireEvent.durationChange(audio);
  expect(audio.currentTime).toBe(0);
  audio.currentTime = 12;
  fireEvent.timeUpdate(audio);
  expect(audio.currentTime).toBe(12);
});

it("leaves recordings with a known length alone", () => {
  const { audio, finish } = renderPlayer();
  finish(30);
  fireEvent.loadedMetadata(audio);
  expect(audio.currentTime).toBe(0);
  expect(audio).not.toHaveAttribute("controlslist", expect.stringContaining("captions"));
  expect(audio.querySelector("track")).toBeNull();
});
