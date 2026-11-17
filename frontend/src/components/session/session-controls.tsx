"use client";

import { HangUpIcon, MicrophoneIcon, MicrophoneOffIcon, TranscriptIcon } from "@/components/icons";
import { useLocale } from "@/i18n/locale";

type SessionControlsProps = {
  muted: boolean;
  transcriptOpen: boolean;
  ending: boolean;
  onToggleMute: () => void;
  onToggleTranscript: () => void;
  onEnd: () => void;
};

const square =
  "grid size-16 place-items-center focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

export function SessionControls({
  muted,
  transcriptOpen,
  ending,
  onToggleMute,
  onToggleTranscript,
  onEnd,
}: SessionControlsProps) {
  const { t } = useLocale();
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <fieldset className="flex">
        <legend className="sr-only">{t.live.controls}</legend>
        <button
          type="button"
          onClick={onToggleMute}
          aria-pressed={muted}
          aria-label={muted ? t.live.unmute : t.live.mute}
          className={`${square} ${
            muted
              ? "bg-persona-rose text-ink hover:bg-persona-rose/85"
              : "bg-raised text-ink hover:bg-white"
          }`}
        >
          {muted ? <MicrophoneOffIcon className="size-6" /> : <MicrophoneIcon className="size-6" />}
        </button>
        <button
          type="button"
          onClick={onToggleTranscript}
          aria-pressed={transcriptOpen}
          aria-label={transcriptOpen ? t.live.hideTranscript : t.live.showTranscript}
          className={`${square} border-l border-ink ${
            transcriptOpen
              ? "bg-raised text-ink hover:bg-white"
              : "bg-ink-line text-white hover:bg-ink-muted/30"
          }`}
        >
          <TranscriptIcon className="size-6" />
        </button>
        <button
          type="button"
          onClick={onEnd}
          disabled={ending}
          aria-label={t.live.end}
          className={`${square} bg-cobalt text-white hover:bg-cobalt/85 disabled:opacity-60`}
        >
          <HangUpIcon className="size-7" />
        </button>
      </fieldset>
      <p className="text-[13px] text-ink-muted">{ending ? t.live.ending : t.live.provider}</p>
    </div>
  );
}
