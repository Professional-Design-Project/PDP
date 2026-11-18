export class ClosingPlayback {
  private id: string | null = null;
  private expected = 0;
  private received = 0;
  private chunks: ArrayBuffer[] = [];
  private audio: HTMLAudioElement | null = null;
  private url: string | null = null;
  private done = false;

  constructor(
    private readonly player: () => HTMLAudioElement,
    private readonly send: (message: object) => void,
    signal: AbortSignal,
  ) {
    signal.addEventListener("abort", () => this.dispose(), { once: true });
  }

  receive(data: Record<string, unknown>) {
    if (this.done) return;
    if (data.kind === "playback.start" && this.id === null && typeof data.id === "string") {
      this.id = data.id;
      if (
        typeof data.bytes !== "number" ||
        !Number.isInteger(data.bytes) ||
        data.bytes <= 44 ||
        data.bytes > 6_000_000
      ) {
        this.finish(false);
        return;
      }
      this.expected = data.bytes;
      return;
    }
    if (data.id !== this.id || this.id === null || this.audio) return;
    if (data.kind === "playback.audio") {
      try {
        if (typeof data.audio !== "string" || data.audio.length > 16_000)
          throw new Error("Invalid audio chunk");
        const decoded = atob(data.audio);
        const chunk = new ArrayBuffer(decoded.length);
        const bytes = new Uint8Array(chunk);
        for (let i = 0; i < decoded.length; i++) bytes[i] = decoded.charCodeAt(i);
        this.received += bytes.length;
        if (this.received > this.expected) throw new Error("Oversized audio");
        this.chunks.push(chunk);
      } catch {
        this.finish(false);
      }
    } else if (data.kind === "playback.end") {
      if (this.received !== this.expected) {
        this.finish(false);
        return;
      }
      try {
        this.url = URL.createObjectURL(new Blob(this.chunks, { type: "audio/wav" }));
        this.chunks = [];
        this.audio = this.player();
        this.audio.srcObject = null;
        this.audio.onended = () => this.finish(true);
        this.audio.onerror = () => this.finish(false);
        this.audio.src = this.url;
        void this.audio.play().catch(() => this.finish(false));
      } catch {
        this.finish(false);
      }
    }
  }

  private finish(played: boolean) {
    if (this.done) return;
    this.dispose();
    this.send({ type: "playback.finished", data: { id: this.id, played } });
  }

  private dispose() {
    this.done = true;
    this.chunks = [];
    if (this.audio) {
      this.audio.onended = null;
      this.audio.onerror = null;
      this.audio.pause();
      this.audio.removeAttribute("src");
      this.audio = null;
    }
    if (this.url) URL.revokeObjectURL(this.url);
    this.url = null;
  }
}
