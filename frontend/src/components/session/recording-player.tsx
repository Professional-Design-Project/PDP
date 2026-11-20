"use client";

import type { CSSProperties } from "react";
import { PauseIcon, PlayIcon } from "@/components/icons";
import { useAudioPlayer } from "@/hooks/use-audio-player";
import { useLocale } from "@/i18n/locale";

function clock(seconds: number) {
  const whole = Math.max(0, Math.floor(seconds));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

export function RecordingPlayer({ src }: { src: string }) {
  const { t } = useLocale();
  const { audioRef, events, playing, position, duration, toggle, seek } = useAudioPlayer();
  const fill = duration ? (position / duration) * 100 : 0;

  return (
    <div className="mt-8 flex items-center gap-4 border border-line bg-white p-3 sm:gap-5 sm:p-4">
      <audio ref={audioRef} src={src} preload="metadata" {...events} />
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? t.recording.pause : t.recording.play}
        className="grid size-12 shrink-0 place-items-center bg-ink text-white hover:bg-ink/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt"
      >
        {playing ? <PauseIcon className="size-5" /> : <PlayIcon className="size-5" />}
      </button>
      <span className="shrink-0 text-[15px] text-muted tabular-nums">
        {clock(position)} / {clock(duration)}
      </span>
      <input
        type="range"
        min={0}
        max={duration || 0}
        step="any"
        value={position}
        disabled={!duration}
        onChange={(event) => seek(Number(event.target.value))}
        aria-label={t.recording.player}
        aria-valuetext={`${clock(position)} / ${clock(duration)}`}
        className="style-range min-w-0 flex-1"
        style={{ "--fill": `${fill}%` } as CSSProperties}
      />
    </div>
  );
}
