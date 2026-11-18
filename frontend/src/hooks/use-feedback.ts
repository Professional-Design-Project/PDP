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
      const code = caught instanceof HttpError ? caught.code : undefined;
      const reasons = {
        feedback_rate_limited: "rate_limited",
        feedback_provider_unavailable: "provider_unavailable",
        feedback_not_configured: "not_configured",
        feedback_invalid_response: "invalid_response",
        feedback_request_rejected: "request_rejected",
        session_conflict: "session_conflict",
      } as const;
      const reason = Object.entries(reasons).find(([key]) => key === code)?.[1];
      setFeedback(
        code === "feedback_unavailable" ? { status: "unavailable" } : { status: "failed", reason },
      );
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
