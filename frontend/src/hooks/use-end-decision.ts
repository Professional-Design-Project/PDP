"use client";

import { useState } from "react";
import type { EndChoice } from "@/components/session/end-choices";
import type { VoiceSession } from "@/lib/api";

type Choosers = {
  feedback: (wantsFeedback: boolean | undefined, session: VoiceSession | null) => void;
  recording: (wantsRecording: boolean) => void;
};

export function useEndDecision(choose: Choosers, canRecord: boolean) {
  const [undecided, setUndecided] = useState(false);

  function finished(wantsFeedback: boolean | undefined, session: VoiceSession | null) {
    choose.feedback(wantsFeedback, session);
    setUndecided(wantsFeedback === undefined);
  }

  function decide(choice: EndChoice, session: VoiceSession | null) {
    setUndecided(false);
    choose.feedback(choice.feedback, session);
    if (canRecord) choose.recording(choice.recording);
  }

  return { undecided, finished, decide, reset: () => setUndecided(false) };
}
