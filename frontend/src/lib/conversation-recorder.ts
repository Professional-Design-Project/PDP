const MIME_TYPES = ["audio/webm;codecs=opus", "audio/ogg;codecs=opus", "audio/mp4"];
const STOP_TIMEOUT_MS = 3000;

export function recordingMimeType() {
  if (typeof MediaRecorder === "undefined" || typeof AudioContext === "undefined") return null;
  return MIME_TYPES.find((type) => MediaRecorder.isTypeSupported(type)) ?? null;
}

export class ConversationRecorder {
  private readonly context: AudioContext;
  private readonly destination: MediaStreamAudioDestinationNode;
  private readonly streams = new Set<string>();
  private readonly chunks: Blob[] = [];
  private recorder: MediaRecorder | null = null;
  private disposed = false;

  private constructor(
    microphone: MediaStream,
    private readonly mimeType: string,
  ) {
    this.context = new AudioContext();
    this.destination = this.context.createMediaStreamDestination();
    this.addStream(microphone);
    void this.context.resume().catch(() => undefined);
  }

  static create(microphone: MediaStream) {
    const mimeType = recordingMimeType();
    if (!mimeType) return null;
    try {
      return new ConversationRecorder(microphone, mimeType);
    } catch {
      return null;
    }
  }

  addStream(stream: MediaStream) {
    if (this.disposed || this.streams.has(stream.id) || !stream.getAudioTracks().length) return;
    this.streams.add(stream.id);
    this.context.createMediaStreamSource(stream).connect(this.destination);
  }

  async addClip(clip: Blob) {
    if (this.disposed) return;
    try {
      const buffer = await this.context.decodeAudioData(await clip.arrayBuffer());
      if (this.disposed) return;
      const source = this.context.createBufferSource();
      source.buffer = buffer;
      source.connect(this.destination);
      source.start();
    } catch {
      return;
    }
  }

  start() {
    if (this.disposed || this.recorder) return;
    try {
      const recorder = new MediaRecorder(this.destination.stream, {
        mimeType: this.mimeType,
        audioBitsPerSecond: 32000,
      });
      recorder.ondataavailable = (event) => {
        if (event.data.size) this.chunks.push(event.data);
      };
      recorder.start(1000);
      this.recorder = recorder;
    } catch {
      this.recorder = null;
    }
  }

  async stop(): Promise<Blob | null> {
    const recorder = this.recorder;
    if (this.disposed || !recorder || recorder.state === "inactive") {
      this.dispose();
      return null;
    }
    await new Promise<void>((resolve) => {
      const timeout = setTimeout(resolve, STOP_TIMEOUT_MS);
      recorder.onstop = () => {
        clearTimeout(timeout);
        resolve();
      };
      recorder.stop();
    });
    const type = this.mimeType.split(";")[0];
    const recording = this.chunks.length ? new Blob(this.chunks, { type }) : null;
    this.dispose();
    return recording;
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    if (this.recorder && this.recorder.state !== "inactive") {
      this.recorder.ondataavailable = null;
      this.recorder.stop();
    }
    this.recorder = null;
    this.chunks.length = 0;
    void this.context.close().catch(() => undefined);
  }
}
