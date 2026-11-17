"use client";

import { useState } from "react";
import { fetchFeedback, HttpError, type VoiceSession } from "@/lib/api";
import type { FeedbackState } from "@/components/session/session-state";

export function useFeedback() {
  const [feedback, setFeedback] = useState<FeedbackState>({ status: "undecided" });

  async function request(session: VoiceSession | null) {
    if (!session) {
      setFeedback({ status: "failed" });
      return;
    }
    setFeedback({ status: "loading" });
    try {
      setFeedback({ status: "ready", result: await fetchFeedback(session) });
    } catch (caught) {
      setFeedback({
        status: caught instanceof HttpError && caught.status === 409 ? "unavailable" : "failed",
      });
    }
  }

  function choose(wantsFeedback: boolean | undefined, session: VoiceSession | null) {
    if (wantsFeedback === true) void request(session);
    else setFeedback({ status: wantsFeedback === false ? "declined" : "undecided" });
  }

  function reset() {
    setFeedback({ status: "undecided" });
  }

  return { feedback, request, choose, reset };
}
