import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  createSession,
  endSession,
  sendOffer,
  type NewSession,
  type VoiceSession,
} from "@/lib/api";
import { defaultStyle } from "@/lib/interview-style";
import { useVoiceSession } from "./use-voice-session";

vi.mock("@/lib/api", () => ({
  createSession: vi.fn(),
  endSession: vi.fn(),
  sendOffer: vi.fn(),
}));

const body: NewSession = {
  scenario_id: "job-interview",
  language: "en",
  context: "Backend role",
  documents: [],
  style: defaultStyle,
  consent: {
    version: "test",
    language: "en",
    voice: true,
    transcripts: true,
    outside_eu: true,
    improvement: false,
  },
};
const session: VoiceSession = {
  id: "session-1",
  access_token: "token",
  signaling_url: "/v1/sessions/session-1/offer",
  ice_servers: [],
};
const offer = { type: "offer", sdp: "offer-sdp" } satisfies RTCSessionDescriptionInit;
const answer = { type: "answer", sdp: "answer-sdp" } satisfies RTCSessionDescriptionInit;
const getUserMedia = vi.fn<() => Promise<MediaStream>>();
const peers: FakePeer[] = [];
let blockedStage: "offer" | "local" | "ice" | "answer" | "remote" | undefined;
let resume: ReturnType<typeof Promise.withResolvers<void>>;

function microphone() {
  const track = { enabled: true, stop: vi.fn() };
  const stream = {
    getTracks: () => [track],
    getAudioTracks: () => [track],
  } as unknown as MediaStream;
  return { stream, track };
}

class FakePeer extends EventTarget {
  iceGatheringState = blockedStage === "ice" ? "gathering" : "complete";
  connectionState = "new";
  localDescription = offer;
  ontrack: ((event: RTCTrackEvent) => void) | null = null;
  onconnectionstatechange: (() => void) | null = null;
  channel = { onmessage: null as ((event: MessageEvent) => void) | null, close: vi.fn() };
  addTrack = vi.fn();
  close = vi.fn();
  createDataChannel = vi.fn(() => this.channel);
  createOffer = vi.fn(async () => {
    if (blockedStage === "offer") await resume.promise;
    return offer;
  });
  setLocalDescription = vi.fn(async () => {
    if (blockedStage === "local") await resume.promise;
  });
  setRemoteDescription = vi.fn(async () => {
    if (blockedStage === "remote") await resume.promise;
  });

  constructor() {
    super();
    peers.push(this);
  }
}

beforeEach(() => {
  vi.resetAllMocks();
  peers.length = 0;
  blockedStage = undefined;
  resume = Promise.withResolvers<void>();
  getUserMedia.mockResolvedValue(microphone().stream);
  vi.mocked(createSession).mockResolvedValue(session);
  vi.mocked(endSession).mockResolvedValue({});
  vi.mocked(sendOffer).mockImplementation(async () => {
    if (blockedStage === "answer") await resume.promise;
    return answer;
  });
  vi.stubGlobal("navigator", { mediaDevices: { getUserMedia } });
  vi.stubGlobal("RTCPeerConnection", FakePeer);
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

it("connects normally and releases the active session once", async () => {
  const mic = microphone();
  getUserMedia.mockResolvedValue(mic.stream);
  const onFinished = vi.fn();
  const { result } = renderHook(() => useVoiceSession({ onFinished }));

  await act(() => result.current.start(body, ""));
  expect(result.current.connected).toBe(true);
  act(() => result.current.toggleMute());
  expect(mic.track.enabled).toBe(false);
  await act(() => result.current.leave(true));
  await act(() => result.current.leave(true));

  expect(mic.track.stop).toHaveBeenCalledOnce();
  expect(peers[0].close).toHaveBeenCalledOnce();
  expect(endSession).toHaveBeenCalledExactlyOnceWith(session);
  expect(onFinished).toHaveBeenCalledExactlyOnceWith(true, session);
  expect(result.current.phase).toBe("summary");
  expect(result.current.connecting).toBe(false);
});

it("ends a late-created session without touching the next conversation", async () => {
  const pending = Promise.withResolvers<VoiceSession>();
  vi.mocked(createSession).mockReturnValueOnce(pending.promise);
  const firstMic = microphone();
  const nextMic = microphone();
  getUserMedia.mockResolvedValueOnce(firstMic.stream).mockResolvedValueOnce(nextMic.stream);
  const nextSession = { ...session, id: "session-2" };
  const onFinished = vi.fn();
  const { result } = renderHook(() => useVoiceSession({ onFinished }));
  let firstStart: Promise<void>;
  await act(async () => {
    firstStart = result.current.start(body, "");
  });
  expect(createSession).toHaveBeenCalledOnce();
  await act(() => result.current.leave(false));
  expect(firstMic.track.stop).toHaveBeenCalledOnce();
  expect(onFinished).toHaveBeenCalledWith(false, null);

  vi.mocked(createSession).mockResolvedValue(nextSession);
  await act(() => result.current.start(body, ""));
  await act(async () => {
    pending.resolve(session);
    await firstStart;
  });

  expect(endSession).toHaveBeenCalledExactlyOnceWith(session);
  expect(nextMic.track.stop).not.toHaveBeenCalled();
  expect(peers).toHaveLength(1);
  expect(peers[0].close).not.toHaveBeenCalled();
  expect(result.current.lastSession()).toBe(nextSession);
  expect(result.current.connected).toBe(true);
  expect(result.current.phase).toBe("session");
});

it.each(["resolve", "reject"] as const)(
  "ignores a cancelled microphone request that later %ss while a new start is pending",
  async (outcome) => {
    const first = Promise.withResolvers<MediaStream>();
    const next = Promise.withResolvers<MediaStream>();
    const mic = microphone();
    getUserMedia.mockReturnValueOnce(first.promise).mockReturnValueOnce(next.promise);
    const { result } = renderHook(() => useVoiceSession({ onFinished: vi.fn() }));
    let firstStart: Promise<void>;
    let nextStart: Promise<void>;
    act(() => {
      firstStart = result.current.start(body, "");
    });
    await act(() => result.current.leave(false));
    act(() => {
      nextStart = result.current.start(body, "");
    });
    await act(async () => {
      if (outcome === "resolve") first.resolve(mic.stream);
      else first.reject(new Error("Permission denied"));
      await firstStart;
    });

    expect(mic.track.stop).toHaveBeenCalledTimes(outcome === "resolve" ? 1 : 0);
    expect(createSession).not.toHaveBeenCalled();
    expect(result.current.phase).toBe("session");
    expect(result.current.connecting).toBe(true);
    expect(result.current.failure).toBeNull();

    await act(async () => {
      next.resolve(microphone().stream);
      await nextStart;
    });
    expect(result.current.connected).toBe(true);
  },
);

it.each(["offer", "local", "ice", "answer", "remote"] as const)(
  "cancels during %s negotiation and ignores stale peer events",
  async (stage) => {
    blockedStage = stage;
    const mic = microphone();
    getUserMedia.mockResolvedValue(mic.stream);
    const { result } = renderHook(() => useVoiceSession({ onFinished: vi.fn() }));
    let starting: Promise<void>;
    await act(async () => {
      starting = result.current.start(body, "");
    });
    const peer = peers[0];
    const onMessage = peer.channel.onmessage;
    const onConnectionChange = peer.onconnectionstatechange;
    await act(() => result.current.leave(false));
    await act(async () => {
      resume.resolve();
      await starting;
      onMessage?.(
        new MessageEvent("message", {
          data: JSON.stringify({ type: "server-message", data: { kind: "session.ready" } }),
        }),
      );
      peer.connectionState = "failed";
      onConnectionChange?.();
    });

    expect(mic.track.stop).toHaveBeenCalledOnce();
    expect(peer.close).toHaveBeenCalledOnce();
    expect(peer.channel.onmessage).toBeNull();
    expect(endSession).toHaveBeenCalledExactlyOnceWith(session);
    expect(result.current.live.readyAt).toBeNull();
    expect(result.current.connected).toBe(false);
    expect(result.current.connecting).toBe(false);
    expect(result.current.phase).toBe("summary");
    if (stage !== "remote") expect(peer.setRemoteDescription).not.toHaveBeenCalled();
    if (["offer", "local", "ice"].includes(stage)) expect(sendOffer).not.toHaveBeenCalled();
  },
);

it("blocks overlapping starts and closes a microphone delivered after unmount", async () => {
  const pending = Promise.withResolvers<MediaStream>();
  const mic = microphone();
  getUserMedia.mockReturnValue(pending.promise);
  const onFinished = vi.fn();
  const { result, unmount } = renderHook(() => useVoiceSession({ onFinished }));
  let starting: Promise<void>;
  act(() => {
    starting = result.current.start(body, "");
    void result.current.start(body, "");
  });
  expect(getUserMedia).toHaveBeenCalledOnce();
  unmount();
  await act(async () => {
    pending.resolve(mic.stream);
    await starting;
  });

  expect(mic.track.stop).toHaveBeenCalledOnce();
  expect(createSession).not.toHaveBeenCalled();
  expect(onFinished).not.toHaveBeenCalled();
});

it("keeps the microphone muted when permission arrives after muting", async () => {
  const pending = Promise.withResolvers<MediaStream>();
  const mic = microphone();
  getUserMedia.mockReturnValue(pending.promise);
  const { result } = renderHook(() => useVoiceSession({ onFinished: vi.fn() }));
  let starting: Promise<void>;
  act(() => {
    starting = result.current.start(body, "");
    result.current.toggleMute();
  });
  await act(async () => {
    pending.resolve(mic.stream);
    await starting;
  });

  expect(result.current.muted).toBe(true);
  expect(mic.track.enabled).toBe(false);
});

it("closes an active connection on unmount without showing a summary", async () => {
  const mic = microphone();
  getUserMedia.mockResolvedValue(mic.stream);
  const onFinished = vi.fn();
  const { result, unmount } = renderHook(() => useVoiceSession({ onFinished }));
  await act(() => result.current.start(body, ""));

  unmount();

  expect(mic.track.stop).toHaveBeenCalledOnce();
  expect(peers[0].close).toHaveBeenCalledOnce();
  expect(endSession).toHaveBeenCalledExactlyOnceWith(session);
  expect(onFinished).not.toHaveBeenCalled();
});

it("releases resources and allows retry after a signaling failure", async () => {
  const mic = microphone();
  getUserMedia.mockResolvedValueOnce(mic.stream);
  vi.mocked(sendOffer).mockRejectedValueOnce(new Error("Connection failed"));
  const { result } = renderHook(() => useVoiceSession({ onFinished: vi.fn() }));

  await act(() => result.current.start(body, ""));

  expect(mic.track.stop).toHaveBeenCalledOnce();
  expect(peers[0].close).toHaveBeenCalledOnce();
  expect(endSession).toHaveBeenCalledExactlyOnceWith(session);
  expect(result.current.phase).toBe("setup");
  expect(result.current.failure).toBe("Connection failed");
  expect(result.current.connecting).toBe(false);

  await act(() => result.current.start(body, ""));
  expect(result.current.connected).toBe(true);
  expect(result.current.failure).toBeNull();
});
