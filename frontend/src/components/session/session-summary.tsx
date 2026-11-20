"use client";

import { arrowMotion, buttonStyles } from "@/components/button-styles";
import { ArrowRightIcon } from "@/components/icons";
import { Rise } from "@/components/rise";
import { FeedbackSection } from "@/components/session/feedback-section";
import { RecordingSection } from "@/components/session/recording-section";
import type { FeedbackState, TranscriptLine } from "@/components/session/session-state";
import { SummaryStats } from "@/components/session/summary-stats";
import { TranscriptSection } from "@/components/session/transcript-section";
import type { RecordingState } from "@/hooks/use-recording";
import { useLocale } from "@/i18n/locale";

type SessionSummaryProps = {
  duration: number;
  transcript: TranscriptLine[];
  synchronized: boolean;
  message: string;
  heading: string;
  feedback: FeedbackState;
  onRequestFeedback: () => void;
  recording?: RecordingState;
  onSaveRecording?: () => void;
  onRecordingDeleted?: () => void;
  onAgain: () => void;
  onSetup: () => void;
};

export function SessionSummary({
  duration,
  transcript,
  synchronized,
  message,
  heading,
  feedback,
  onRequestFeedback,
  recording = { status: "none" },
  onSaveRecording = () => undefined,
  onRecordingDeleted = () => undefined,
  onAgain,
  onSetup,
}: SessionSummaryProps) {
  const { t } = useLocale();
  return (
    <main className="mx-auto max-w-7xl px-4 pt-12 pb-24 sm:px-8 sm:pt-16">
      <div className="grid gap-6 lg:grid-cols-12 lg:items-end lg:gap-8">
        <Rise
          as="h1"
          className="text-[56px] leading-[0.92] font-bold tracking-[-0.04em] sm:text-[96px] lg:col-span-7"
        >
          {heading}
        </Rise>
        <Rise
          as="p"
          delay={50}
          className="max-w-md text-lg leading-relaxed text-ink/80 lg:col-span-5"
        >
          {message} {t.summary.practice}
        </Rise>
      </div>

      {!synchronized && (
        <output className="mt-8 block text-muted">{t.summary.unsynchronized}</output>
      )}
      <SummaryStats duration={duration} transcript={transcript} />

      <Rise delay={150} className="mt-10 flex flex-col gap-3 sm:flex-row">
        <button type="button" onClick={onAgain} className={`${buttonStyles.ink} sm:w-72`}>
          {t.summary.again}
          <ArrowRightIcon className={arrowMotion} />
        </button>
        <button type="button" onClick={onSetup} className={buttonStyles.outline}>
          {t.summary.setup}
        </button>
      </Rise>

      <FeedbackSection state={feedback} transcript={transcript} onRequest={onRequestFeedback} />
      <RecordingSection state={recording} onSave={onSaveRecording} onDeleted={onRecordingDeleted} />
      <TranscriptSection transcript={transcript} />
    </main>
  );
}
