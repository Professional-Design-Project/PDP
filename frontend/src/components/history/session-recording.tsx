"use client";

import { RecordingPlayer } from "@/components/session/recording-player";
import type { TranscriptLine } from "@/components/session/session-state";
import { useSupabaseQuery } from "@/hooks/use-supabase-query";
import { useLocale } from "@/i18n/locale";
import { formatDate } from "@/lib/format";
import { loadRecording } from "@/lib/recordings";

type SessionRecordingProps = {
  sessionId: string;
  transcript: TranscriptLine[];
};

export function SessionRecording({ sessionId, transcript }: SessionRecordingProps) {
  const { locale, t } = useLocale();
  const { state } = useSupabaseQuery(
    (supabase) => loadRecording(supabase, sessionId),
    `recording:${sessionId}`,
  );
  if (state.status !== "ready" || !state.data) return null;
  return (
    <section aria-labelledby="recording-title" className="mt-16 print:hidden">
      <div className="grid gap-4 border-t-2 border-ink pt-5 lg:grid-cols-12 lg:gap-8">
        <h2
          id="recording-title"
          className="text-[32px] leading-tight font-bold tracking-tight lg:col-span-7"
        >
          {t.recording.title}
        </h2>
        <p className="max-w-md text-[15px] leading-relaxed text-muted lg:col-span-5">
          {t.recording.historyNotice(formatDate(state.data.expiresAt, locale))}
        </p>
      </div>
      <RecordingPlayer src={state.data.playUrl} transcript={transcript} />
      <a
        href={state.data.downloadUrl}
        className="mt-4 inline-block text-[15px] font-semibold underline underline-offset-4 hover:text-cobalt focus-visible:outline-2 focus-visible:outline-cobalt"
      >
        {t.recording.download}
      </a>
    </section>
  );
}
