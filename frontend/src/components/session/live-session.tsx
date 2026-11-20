"use client";

import { useState } from "react";
import { useModalDialog } from "@/hooks/use-modal-dialog";
import { useSessionClock } from "@/hooks/use-session-clock";
import { InterviewerCard } from "@/components/session/interviewer-card";
import { LeavePanel, type LeaveChoice } from "@/components/session/leave-panel";
import { SessionCaptions } from "@/components/session/session-captions";
import { SessionControls } from "@/components/session/session-controls";
import { SessionHeader } from "@/components/session/session-header";
import type { LiveState } from "@/components/session/session-state";
import { TranscriptPanel } from "@/components/session/transcript-panel";

type LiveSessionProps = {
  state: LiveState;
  connected: boolean;
  language: string;
  scenario: string;
  muted: boolean;
  ending: boolean;
  canRecord?: boolean;
  onToggleMute: () => void;
  onLeave: (choice: LeaveChoice) => void;
};

export function LiveSession({
  state,
  connected,
  language,
  scenario,
  muted,
  ending,
  canRecord = false,
  onToggleMute,
  onLeave,
}: LiveSessionProps) {
  const [showTranscript, setShowTranscript] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const { dialogRef, focusRef } = useModalDialog<HTMLHeadingElement>();
  const elapsed = useSessionClock(state.readyAt);
  const live = state.readyAt !== null && connected;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="session-title"
      onCancel={(event) => event.preventDefault()}
      className="fixed inset-0 z-50 m-0 h-dvh max-h-none w-full max-w-none animate-room flex-col overflow-hidden bg-ink p-0 text-white backdrop:bg-ink open:flex"
    >
      <SessionHeader scenario={scenario} language={language} elapsed={elapsed} live={live} />

      <div className="flex min-h-0 flex-1">
        <div className="flex min-w-0 flex-1 flex-col px-4 pt-8 pb-6 sm:px-8 sm:pt-12">
          <InterviewerCard live={live} speaking={state.botSpeaking} headingRef={focusRef} />
          <SessionCaptions state={state} live={live} muted={muted} />
          <SessionControls
            muted={muted}
            transcriptOpen={showTranscript}
            ending={ending}
            onToggleMute={onToggleMute}
            onToggleTranscript={() => setShowTranscript((open) => !open)}
            onEnd={() => setLeaving(true)}
          />
        </div>

        {showTranscript && (
          <TranscriptPanel transcript={state.transcript} onClose={() => setShowTranscript(false)} />
        )}
      </div>

      {leaving && !ending && (
        <LeavePanel
          canRecord={canRecord}
          onLeave={(choice) => {
            setLeaving(false);
            onLeave(choice);
          }}
          onStay={() => setLeaving(false)}
        />
      )}
    </dialog>
  );
}
