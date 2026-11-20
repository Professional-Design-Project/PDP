"use client";

import { Loader } from "@/components/loader";
import { RecordingPlayer } from "@/components/session/recording-player";
import type { TranscriptLine } from "@/components/session/session-state";
import type { RecordingState } from "@/hooks/use-recording";
import { useLocale } from "@/i18n/locale";

type RecordingSectionProps = {
  state: RecordingState;
  transcript: TranscriptLine[];
  onSave: () => void;
};

export function RecordingSection({ state, transcript, onSave }: RecordingSectionProps) {
  const { t } = useLocale();
  if (state.status === "none") return null;
  return (
    <section
      aria-labelledby="recording-title"
      aria-busy={state.status === "saving"}
      className="mt-16"
    >
      <div className="grid gap-4 border-t-2 border-ink pt-5 lg:grid-cols-12 lg:gap-8">
        <h2
          id="recording-title"
          className="text-[32px] leading-tight font-bold tracking-tight lg:col-span-7"
        >
          {t.recording.title}
        </h2>
        <p className="max-w-md text-[15px] leading-relaxed text-muted lg:col-span-5">
          {t.recording.notice}
        </p>
      </div>

      <RecordingPlayer src={state.url} transcript={transcript} />

      {(state.status === "undecided" || state.status === "declined") && (
        <div className="mt-5 flex animate-caption flex-col gap-5 border border-line bg-white p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <p className="max-w-lg text-lg leading-snug">
            {state.status === "declined" ? t.recording.declined : t.recording.offer}
          </p>
          <button
            type="button"
            onClick={onSave}
            className="h-12 shrink-0 border border-ink px-6 font-semibold hover:bg-ink hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt"
          >
            {t.recording.save}
          </button>
        </div>
      )}

      {state.status === "saving" && (
        <output className="mt-5 inline-flex items-center gap-3 text-[15px] text-muted">
          <Loader className="text-[18px] text-cobalt" />
          {t.recording.saving}
        </output>
      )}

      {state.status === "saved" && (
        <output className="mt-5 block animate-caption text-lg text-ink/80">
          {t.recording.saved}
        </output>
      )}

      {state.status === "failed" && (
        <div className="mt-5 flex animate-caption flex-col gap-4 sm:flex-row sm:items-center">
          <p role="alert" className="text-lg text-ink/80">
            {t.recording.failed}
          </p>
          <button
            type="button"
            onClick={onSave}
            className="h-12 border border-ink px-5 font-semibold hover:bg-ink hover:text-white focus-visible:outline-2 focus-visible:outline-cobalt"
          >
            {t.recording.retry}
          </button>
        </div>
      )}
    </section>
  );
}
