import { expect, it } from "vitest";
import { captionsDataUrl, transcriptCaptions } from "./transcript-captions";

const speakers = { user: "You", assistant: "Interviewer" };

it("turns the transcript into WebVTT cues between saved turns", () => {
  const captions = transcriptCaptions(
    [
      { id: "1", role: "assistant", text: "Tell me <about> you.", at: 4, interrupted: false },
      { id: "2", role: "user", text: "I build\nAPIs & tools.", at: 3725, interrupted: false },
    ],
    speakers,
  );
  expect(captions).toBe(
    "WEBVTT\n\n" +
      "00:00:00.000 --> 00:00:04.000\nInterviewer: Tell me &lt;about&gt; you.\n\n" +
      "00:00:04.000 --> 01:02:05.000\nYou: I build APIs &amp; tools.\n",
  );
});

it("gives every cue at least one second", () => {
  const captions = transcriptCaptions(
    [
      { id: "1", role: "assistant", text: "Hi", at: 2, interrupted: false },
      { id: "2", role: "user", text: "Hello", at: 2, interrupted: false },
    ],
    speakers,
  );
  expect(captions).toContain("00:00:02.000 --> 00:00:03.000\nYou: Hello");
});

it("encodes the captions as a data URL", () => {
  expect(captionsDataUrl([], speakers)).toBe("data:text/vtt;charset=utf-8,WEBVTT%0A");
});
