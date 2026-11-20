import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { ConversationRecorder, recordingMimeType } from "./conversation-recorder";

const connected: string[] = [];
const recorders: FakeRecorder[] = [];
let contextClosed = false;

class FakeRecorder {
  static isTypeSupported = (type: string) => type === "audio/webm;codecs=opus";
  state: RecordingState = "inactive";
  ondataavailable: ((event: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  constructor(
    readonly stream: MediaStream,
    readonly options: MediaRecorderOptions,
  ) {
    recorders.push(this);
  }
  start() {
    this.state = "recording";
  }
  stop() {
    this.state = "inactive";
    this.ondataavailable?.({ data: new Blob(["chunk"]) });
    this.onstop?.();
  }
}

class FakeContext {
  createMediaStreamDestination() {
    return { stream: { id: "mixed" } };
  }
  createMediaStreamSource(stream: MediaStream) {
    return { connect: () => connected.push(stream.id) };
  }
  createBufferSource() {
    return { buffer: null, connect: () => connected.push("clip"), start: vi.fn() };
  }
  decodeAudioData = async () => ({});
  resume = async () => undefined;
  close = async () => {
    contextClosed = true;
  };
}

function stream(id: string, tracks = 1) {
  return { id, getAudioTracks: () => Array.from({ length: tracks }) } as unknown as MediaStream;
}

beforeEach(() => {
  connected.length = 0;
  recorders.length = 0;
  contextClosed = false;
  vi.stubGlobal("MediaRecorder", FakeRecorder);
  vi.stubGlobal("AudioContext", FakeContext);
});

afterEach(() => vi.unstubAllGlobals());

it("picks the first audio format the browser can record", () => {
  expect(recordingMimeType()).toBe("audio/webm;codecs=opus");
  vi.stubGlobal("MediaRecorder", undefined);
  expect(recordingMimeType()).toBeNull();
  expect(ConversationRecorder.create(stream("mic"))).toBeNull();
});

it("mixes the microphone, the interviewer and the closing clip into one recording", async () => {
  const recorder = ConversationRecorder.create(stream("mic"))!;
  recorder.addStream(stream("remote"));
  recorder.addStream(stream("remote"));
  recorder.addStream(stream("video-only", 0));
  await recorder.addClip({ arrayBuffer: async () => new ArrayBuffer(4) } as Blob);
  recorder.start();
  recorder.start();
  expect(connected).toEqual(["mic", "remote", "clip"]);
  expect(recorders).toHaveLength(1);
  expect(recorders[0].options).toEqual({
    mimeType: "audio/webm;codecs=opus",
    audioBitsPerSecond: 32000,
  });

  const recording = await recorder.stop();
  expect(recording?.type).toBe("audio/webm");
  expect(recording?.size).toBe(5);
  expect(contextClosed).toBe(true);
});

it("returns nothing when the conversation never started", async () => {
  const recorder = ConversationRecorder.create(stream("mic"))!;
  await expect(recorder.stop()).resolves.toBeNull();
  expect(contextClosed).toBe(true);
});

it("drops everything once disposed", async () => {
  const recorder = ConversationRecorder.create(stream("mic"))!;
  recorder.start();
  recorder.dispose();
  recorder.addStream(stream("remote"));
  expect(connected).toEqual(["mic"]);
  await expect(recorder.stop()).resolves.toBeNull();
});
