"use client";

import { useMemo } from "react";
import type { TranscriptLine } from "@/components/session/session-state";
import { useLocale } from "@/i18n/locale";
import { captionsDataUrl } from "@/lib/transcript-captions";

type RecordingPlayerProps = {
  src: string;
  transcript: TranscriptLine[];
};

export function RecordingPlayer({ src, transcript }: RecordingPlayerProps) {
  const { locale, t } = useLocale();
  const captions = useMemo(
    () => captionsDataUrl(transcript, { user: t.common.you, assistant: t.common.interviewer }),
    [transcript, t.common.you, t.common.interviewer],
  );
  return (
    <audio
      controls
      preload="metadata"
      src={src}
      aria-label={t.recording.player}
      className="mt-8 w-full"
    >
      <track kind="captions" src={captions} srcLang={locale} label={t.summary.transcript} />
    </audio>
  );
}
