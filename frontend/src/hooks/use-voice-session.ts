"use client";

import { useRef, useState } from "react";
import { audioConstraints } from "@/hooks/use-microphone";
import { useMountEffect } from "@/hooks/use-mount-effect";
import { ClosingPlayback } from "@/lib/closing-playback";
import {
  createSession,
  endSession,
  fetchSession,
  fetchTranscript,
  sendOffer,
  type NewSession,
  type VoiceSession,
} from "@/lib/api";
import {
  endKind,
  initialLiveState,
  liveReducer,
  type EndKind,
  type LiveAction,
  type TranscriptLine,
} from "@/components/session/session-state";

export type Phase = "setup" | "session" | "summary";
export type ConnectionStatus = "ready" | "requesting" | "connecting" | "connected" | "failed";
export type SessionSummaryData = {
  duration: number;
  transcript: TranscriptLine[];
  end: EndKind;
  synchronized: boolean;
};

type Options = {
  onFinished: (wantsFeedback: boolean | undefined, session: VoiceSession | null) => void;
};

type ConnectionAttempt = {
  controller: AbortController;
  muted: boolean;
  closing?: boolean;
  stream?: MediaStream;
  session?: VoiceSession;
  peer?: RTCPeerConnection;
  channel?: RTCDataChannel;
  audio?: HTMLAudioElement;
  recovery?: AbortController;
  disconnectTimer?: ReturnType<typeof setTimeout>;
};

async function disconnect(attempt: ConnectionAttempt) {
  attempt.controller.abort();
  clearTimeout(attempt.disconnectTimer);
  if (attempt.channel) {
    attempt.channel.onmessage = null;
    attempt.channel.onclose = null;
    attempt.channel.onerror = null;
    attempt.channel.close();
    attempt.channel = undefined;
  }
  if (attempt.peer) {
    attempt.peer.ontrack = null;
    attempt.peer.onconnectionstatechange = null;
    attempt.peer.close();
    attempt.peer = undefined;
  }
  attempt.stream?.getTracks().forEach((track) => track.stop());
  attempt.stream = undefined;
  if (attempt.audio) {
    attempt.audio.srcObject = null;
    attempt.audio = undefined;
  }
  const session = attempt.session;
  attempt.session = undefined;
  if (session) await endSession(session).catch(() => undefined);
}

function waitForIce(peer: RTCPeerConnection, signal: AbortSignal) {
  if (peer.iceGatheringState === "complete" || signal.aborted) return Promise.resolve();
  return new Promise<void>((resolve) => {
    const finish = () => {
      peer.removeEventListener("icegatheringstatechange", check);
      signal.removeEventListener("abort", finish);
      clearTimeout(timeout);
      resolve();
    };
    const check = () => {
      if (peer.iceGatheringState === "complete") finish();
    };
    const timeout = setTimeout(finish, 10000);
    peer.addEventListener("icegatheringstatechange", check);
    signal.addEventListener("abort", finish, { once: true });
  });
}

export function useVoiceSession({ onFinished }: Options) {
  const [phase, setPhase] = useState<Phase>("setup");
  const [live, setLive] = useState(initialLiveState);
  const [status, setStatus] = useState<ConnectionStatus>("ready");
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [ending, setEnding] = useState(false);
  const [muted, setMuted] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [summary, setSummary] = useState<SessionSummaryData | null>(null);
  const attemptRef = useRef<ConnectionAttempt | null>(null);
  const lastSessionRef = useRef<VoiceSession | null>(null);
  const liveRef = useRef(initialLiveState);

  function dispatch(action: LiveAction) {
    liveRef.current = liveReducer(liveRef.current, action);
    setLive(liveRef.current);
  }

  useMountEffect(() => {
    return () => {
      const attempt = attemptRef.current;
      attemptRef.current = null;
      attempt?.recovery?.abort();
      if (attempt) void disconnect(attempt);
    };
  });

  function isCurrent(attempt: ConnectionAttempt) {
    return attemptRef.current === attempt && !attempt.controller.signal.aborted;
  }

  async function finish(reason: string, failed: boolean, wantsFeedback?: boolean) {
    const attempt = attemptRef.current;
    if (!attempt || !isCurrent(attempt)) return;
    const session = attempt.session ?? null;
    const current = liveRef.current;
    const duration =
      current.readyAt === null ? 0 : Math.max(0, Math.round((Date.now() - current.readyAt) / 1000));
    let result: SessionSummaryData = {
      duration,
      transcript: current.transcript,
      end: endKind(reason, failed),
      synchronized: session === null,
    };
    const recovery = new AbortController();
    attempt.recovery = recovery;
    setEnding(true);
    setConnected(false);
    setConnecting(false);
    await disconnect(attempt);
    if (attemptRef.current !== attempt) return;
    if (session) {
      try {
        const signal = AbortSignal.any([recovery.signal, AbortSignal.timeout(10000)]);
        const saved = await fetchSession(session, signal);
        signal.throwIfAborted();
        if (saved.status !== "ended" && saved.status !== "failed") {
          throw new Error("Session is still running");
        }
        const events = await fetchTranscript(session, signal);
        const startedAt = saved.started_at ? Date.parse(saved.started_at) : null;
        result = {
          duration:
            startedAt !== null && saved.ended_at
              ? Math.max(0, Math.round((Date.parse(saved.ended_at) - startedAt) / 1000))
              : 0,
          transcript: events.map((event) => ({
            id: String(event.sequence),
            role: event.data.role,
            text: event.data.text.trim(),
            at:
              startedAt === null
                ? 0
                : Math.max(0, Math.round((Date.parse(event.timestamp) - startedAt) / 1000)),
            interrupted: event.data.interrupted,
          })),
          end: endKind(
            saved.end_reason ?? reason,
            saved.status === "failed" || (failed && saved.end_reason === "user_ended"),
          ),
          synchronized: true,
        };
      } catch {
        // Keep the live transcript if the final server state cannot be recovered.
      }
    }
    if (attemptRef.current !== attempt) return;
    attemptRef.current = null;
    setSummary(result);
    setPhase("summary");
    setStatus("ready");
    setEnding(false);
    setMuted(false);
    window.scrollTo({ top: 0 });
    onFinished(wantsFeedback, session);
  }

  function connectPeer(attempt: ConnectionAttempt, session: VoiceSession, stream: MediaStream) {
    const peer = new RTCPeerConnection({
      iceServers: session.ice_servers,
      bundlePolicy: "max-bundle",
    });
    attempt.peer = peer;
    stream.getTracks().forEach((track) => peer.addTrack(track, stream));
    peer.ontrack = (event) => {
      if (!isCurrent(attempt) || attempt.closing) return;
      const audio = attempt.audio ?? new Audio();
      audio.autoplay = true;
      attempt.audio = audio;
      audio.srcObject = event.streams[0] || new MediaStream([event.track]);
      void audio.play();
    };
    peer.onconnectionstatechange = () => {
      if (!isCurrent(attempt)) return;
      clearTimeout(attempt.disconnectTimer);
      if (peer.connectionState === "connected") {
        setConnected(true);
        setStatus("connected");
      } else if (peer.connectionState === "disconnected") {
        setConnected(false);
        setStatus("connecting");
        attempt.disconnectTimer = setTimeout(() => {
          if (isCurrent(attempt)) void finish("transport_failed", true);
        }, 5000);
      } else if (peer.connectionState === "failed" || peer.connectionState === "closed") {
        void finish("transport_failed", true);
      }
    };
    const channel = peer.createDataChannel("rtvi-ai");
    attempt.channel = channel;
    channel.onclose = channel.onerror = () => {
      if (isCurrent(attempt)) void finish("transport_failed", true);
    };
    const playback = new ClosingPlayback(
      () => (attempt.audio ??= new Audio()),
      (message) => {
        if (isCurrent(attempt) && channel.readyState === "open") {
          channel.send(JSON.stringify(message));
        }
      },
      attempt.controller.signal,
    );
    channel.onmessage = (event) => {
      if (!isCurrent(attempt)) return;
      try {
        const message = JSON.parse(event.data);
        if (message.type === "server-message" && message.data && typeof message.data === "object") {
          if (message.data.kind === "playback.start") {
            attempt.closing = true;
            setEnding(true);
            attempt.stream?.getAudioTracks().forEach((track) => {
              track.enabled = false;
            });
          }
          playback.receive(message.data);
        }
        dispatch({ type: "message", message, now: Date.now() });
        if (liveRef.current.ended) {
          const { reason, failed } = liveRef.current.ended;
          void finish(reason, failed);
        }
      } catch {
        return;
      }
    };
    return peer;
  }

  async function start(body: NewSession, microphone: string) {
    if (attemptRef.current) return;
    const attempt: ConnectionAttempt = { controller: new AbortController(), muted: false };
    attemptRef.current = attempt;
    lastSessionRef.current = null;
    setFailure(null);
    setSummary(null);
    setMuted(false);
    dispatch({ type: "reset" });
    setEnding(false);
    setConnecting(true);
    setPhase("session");
    setStatus("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia(audioConstraints(microphone));
      attempt.stream = stream;
      if (!isCurrent(attempt)) return;
      stream.getAudioTracks().forEach((track) => {
        track.enabled = !attempt.muted;
      });
      const session = await createSession(body);
      attempt.session = session;
      if (!isCurrent(attempt)) return;
      lastSessionRef.current = session;
      const peer = connectPeer(attempt, session, stream);
      setStatus("connecting");
      const offer = await peer.createOffer();
      if (!isCurrent(attempt)) return;
      await peer.setLocalDescription(offer);
      if (!isCurrent(attempt)) return;
      await waitForIce(peer, attempt.controller.signal);
      if (!isCurrent(attempt)) return;
      const answer = await sendOffer(session, peer.localDescription?.sdp);
      if (!isCurrent(attempt)) return;
      await peer.setRemoteDescription(answer);
      if (!isCurrent(attempt)) return;
    } catch (caught) {
      if (!isCurrent(attempt)) return;
      await disconnect(attempt);
      if (attemptRef.current !== attempt) return;
      attemptRef.current = null;
      setConnected(false);
      setConnecting(false);
      setPhase("setup");
      setFailure(caught instanceof Error ? caught.message : "");
      setStatus("failed");
    } finally {
      if (isCurrent(attempt)) setConnecting(false);
      else await disconnect(attempt);
    }
  }

  async function leave(wantsFeedback: boolean) {
    const attempt = attemptRef.current;
    if (!attempt || !isCurrent(attempt)) return;
    setEnding(true);
    await finish("user_ended", false, wantsFeedback);
  }

  function toggleMute() {
    const attempt = attemptRef.current;
    if (!attempt || !isCurrent(attempt) || attempt.closing) return;
    const next = !attempt.muted;
    attempt.muted = next;
    attempt.stream?.getAudioTracks().forEach((track) => {
      track.enabled = !next;
    });
    setMuted(next);
  }

  return {
    phase,
    backToSetup: () => setPhase("setup"),
    live,
    status,
    connecting,
    connected,
    ending,
    muted,
    failure,
    summary,
    lastSession: () => lastSessionRef.current,
    start,
    leave,
    toggleMute,
  };
}
