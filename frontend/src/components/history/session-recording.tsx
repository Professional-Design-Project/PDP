"use client";

import { useState } from "react";
import { DeleteRecording } from "@/components/recordings/delete-recording";
import { RecordingPlayer } from "@/components/session/recording-player";
import { useSupabaseQuery } from "@/hooks/use-supabase-query";
import { useLocale } from "@/i18n/locale";
import { formatDate } from "@/lib/format";
import { loadRecording } from "@/lib/recordings";

export function SessionRecording({ sessionId }: { sessionId: string }) {
  const { locale, t } = useLocale();
  const [deleted, setDeleted] = useState(false);
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
        {!deleted && (
          <p className="max-w-md text-[15px] leading-relaxed text-muted lg:col-span-5">
            {t.recording.historyNotice(formatDate(state.data.expiresAt, locale))}
          </p>
        )}
      </div>
      {deleted ? (
        <output className="mt-6 block animate-caption text-lg text-ink/80">
          {t.recording.deleted}
        </output>
      ) : (
        <>
          <RecordingPlayer src={state.data.playUrl} />
          <a
            href={state.data.downloadUrl}
            className="mt-4 inline-block text-[15px] font-semibold underline underline-offset-4 hover:text-cobalt focus-visible:outline-2 focus-visible:outline-cobalt"
          >
            {t.recording.download}
          </a>
          <DeleteRecording sessionId={sessionId} onDeleted={() => setDeleted(true)} />
        </>
      )}
    </section>
  );
}
