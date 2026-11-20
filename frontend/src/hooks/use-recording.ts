"use client";

import { useRef, useState } from "react";
import { useMountEffect } from "@/hooks/use-mount-effect";
import type { VoiceSession } from "@/lib/api";
import { uploadRecording } from "@/lib/recordings";
import { browserClient } from "@/lib/supabase/client";

export type RecordingStatus = "undecided" | "declined" | "saving" | "saved" | "failed";
export type RecordingState =
  | { status: "none" }
  | { status: "deleted"; sessionId: string }
  | { status: RecordingStatus; url: string; sessionId: string };

type Take = { recording: Blob; sessionId: string; url: string };

export function useRecording() {
  const [state, setState] = useState<RecordingState>({ status: "none" });
  const wantedRef = useRef<boolean | undefined>(undefined);
  const takeRef = useRef<Take | null>(null);

  function release() {
    if (takeRef.current) URL.revokeObjectURL(takeRef.current.url);
    takeRef.current = null;
  }

  useMountEffect(() => release);

  async function save() {
    const take = takeRef.current;
    if (!take) return;
    setState({ status: "saving", url: take.url, sessionId: take.sessionId });
    try {
      const supabase = browserClient();
      if (!supabase) throw new Error("Storage is not configured");
      await uploadRecording(supabase, take.sessionId, take.recording);
      if (takeRef.current === take) {
        setState({ status: "saved", url: take.url, sessionId: take.sessionId });
      }
    } catch {
      if (takeRef.current === take) {
        setState({ status: "failed", url: take.url, sessionId: take.sessionId });
      }
    }
  }

  function choose(wantsRecording: boolean) {
    wantedRef.current = wantsRecording;
    const take = takeRef.current;
    if (!take) return;
    if (wantsRecording) void save();
    else setState({ status: "declined", url: take.url, sessionId: take.sessionId });
  }

  function receive(recording: Blob, session: VoiceSession) {
    release();
    const url = URL.createObjectURL(recording);
    takeRef.current = { recording, sessionId: session.id, url };
    if (wantedRef.current) void save();
    else {
      const status = wantedRef.current === false ? "declined" : "undecided";
      setState({ status, url, sessionId: session.id });
    }
  }

  function deleted() {
    const take = takeRef.current;
    if (!take) return;
    release();
    setState({ status: "deleted", sessionId: take.sessionId });
  }

  function reset() {
    release();
    wantedRef.current = undefined;
    setState({ status: "none" });
  }

  return { recording: state, choose, receive, save, deleted, reset };
}
