"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import { audioConstraints } from "@/hooks/use-microphone";
import {
  createSession,
  endSession,
  sendOffer,
  type NewSession,
  type VoiceSession,
} from "@/lib/api";
import {
  endKind,
  initialLiveState,
  liveReducer,
  type EndKind,
  type TranscriptLine,
} from "@/components/session/session-state";

export type Phase = "setup" | "session" | "summary";
export type ConnectionStatus = "ready" | "requesting" | "connecting" | "connected" | "failed";
export type SessionSummaryData = { duration: number; transcript: TranscriptLine[]; end: EndKind };

type Options = {
  onFinished: (wantsFeedback: boolean | undefined, session: VoiceSession | null) => void;
};

function waitForIce(peer: RTCPeerConnection) {
  if (peer.iceGatheringState === "complete") return Promise.resolve();
  return new Promise<void>((resolve) => {
    const check = () => {
      if (peer.iceGatheringState !== "complete") return;
      peer.removeEventListener("icegatheringstatechange", check);
      resolve();
    };
    peer.addEventListener("icegatheringstatechange", check);
    setTimeout(resolve, 10000);
  });
}

export function useVoiceSession({ onFinished }: Options) {
  const [phase, setPhase] = useState<Phase>("setup");
  const [live, dispatch] = useReducer(liveReducer, initialLiveState);
  const [status, setStatus] = useState<ConnectionStatus>("ready");
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [ending, setEnding] = useState(false);
  const [muted, setMuted] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [summary, setSummary] = useState<SessionSummaryData | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sessionRef = useRef<VoiceSession | null>(null);
  const lastSessionRef = useRef<VoiceSession | null>(null);
  const liveRef = useRef(live);
  const finishingRef = useRef(false);

  useEffect(() => {
    liveRef.current = live;
  }, [live]);

  async function disconnect() {
    const session = sessionRef.current;
    peerRef.current?.close();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    if (audioRef.current) audioRef.current.srcObject = null;
    peerRef.current = null;
    streamRef.current = null;
    sessionRef.current = null;
    setConnected(false);
    setStatus("ready");
    if (session) await endSession(session).catch(() => undefined);
  }

  async function finish(reason: string, failed: boolean, wantsFeedback?: boolean) {
    if (finishingRef.current) return;
    finishingRef.current = true;
    const current = liveRef.current;
    const duration =
      current.readyAt === null ? 0 : Math.max(0, Math.round((Date.now() - current.readyAt) / 1000));
    await disconnect();
    setSummary({ duration, transcript: current.transcript, end: endKind(reason, failed) });
    setPhase("summary");
    setMuted(false);
    window.scrollTo({ top: 0 });
    onFinished(wantsFeedback, lastSessionRef.current);
  }

  const finishRef = useRef(finish);
  useEffect(() => {
    finishRef.current = finish;
  });

  useEffect(() => {
    if (live.ended) void finishRef.current(live.ended.reason, live.ended.failed);
  }, [live.ended]);

  function connectPeer(session: VoiceSession, stream: MediaStream) {
    const peer = new RTCPeerConnection({ iceServers: session.ice_servers });
    stream.getTracks().forEach((track) => peer.addTrack(track, stream));
    peer.ontrack = (event) => {
      const audio = audioRef.current ?? new Audio();
      audio.autoplay = true;
      audioRef.current = audio;
      audio.srcObject = event.streams[0] || new MediaStream([event.track]);
      void audio.play();
    };
    peer.onconnectionstatechange = () => {
      if (peer.connectionState === "failed") void finishRef.current("transport_failed", true);
    };
    const channel = peer.createDataChannel("rtvi-ai");
    channel.onmessage = (event) => {
      try {
        dispatch({ type: "message", message: JSON.parse(event.data), now: Date.now() });
      } catch {
        return;
      }
    };
    return peer;
  }

  async function start(body: NewSession, microphone: string) {
    setFailure(null);
    setSummary(null);
    setMuted(false);
    dispatch({ type: "reset" });
    finishingRef.current = false;
    setConnecting(true);
    setPhase("session");
    setStatus("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia(audioConstraints(microphone));
      streamRef.current = stream;
      const session = await createSession(body);
      const peer = connectPeer(session, stream);
      sessionRef.current = session;
      lastSessionRef.current = session;
      peerRef.current = peer;
      setStatus("connecting");
      await peer.setLocalDescription(await peer.createOffer());
      await waitForIce(peer);
      await peer.setRemoteDescription(await sendOffer(session, peer.localDescription?.sdp));
      setConnected(true);
      setStatus("connected");
    } catch (caught) {
      finishingRef.current = true;
      await disconnect();
      setPhase("setup");
      setFailure(caught instanceof Error ? caught.message : "");
      setStatus("failed");
    } finally {
      setConnecting(false);
    }
  }

  async function leave(wantsFeedback: boolean) {
    setEnding(true);
    await finish("user_ended", false, wantsFeedback);
    setEnding(false);
  }

  function toggleMute() {
    const next = !muted;
    streamRef.current?.getAudioTracks().forEach((track) => {
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
