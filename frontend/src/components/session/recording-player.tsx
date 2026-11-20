"use client";

import { useRef, type SyntheticEvent } from "react";
import { useLocale } from "@/i18n/locale";

export function RecordingPlayer({ src }: { src: string }) {
  const { t } = useLocale();
  const probingRef = useRef(false);

  function revealDuration(event: SyntheticEvent<HTMLAudioElement>) {
    const audio = event.currentTarget;
    if (Number.isFinite(audio.duration)) return;
    probingRef.current = true;
    audio.currentTime = Number.MAX_SAFE_INTEGER;
  }

  function rewind(event: SyntheticEvent<HTMLAudioElement>) {
    const audio = event.currentTarget;
    if (!probingRef.current || !Number.isFinite(audio.duration)) return;
    probingRef.current = false;
    audio.currentTime = 0;
  }

  return (
    <audio
      controls
      controlsList="nodownload noplaybackrate"
      preload="metadata"
      src={src}
      aria-label={t.recording.player}
      onLoadedMetadata={revealDuration}
      onDurationChange={rewind}
      onTimeUpdate={rewind}
      className="mt-8 w-full"
    />
  );
}
