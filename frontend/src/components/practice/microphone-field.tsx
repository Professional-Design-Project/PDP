"use client";

import { MicrophoneIcon } from "@/components/icons";
import { StatusLine } from "@/components/status-line";
import { micTone, type useMicrophone } from "@/hooks/use-microphone";
import { useLocale } from "@/i18n/locale";

type MicrophoneFieldProps = {
  mic: ReturnType<typeof useMicrophone>;
  disabled: boolean;
};

export function MicrophoneField({ mic, disabled }: MicrophoneFieldProps) {
  const { t } = useLocale();
  return (
    <div>
      <label htmlFor="microphone" className="font-semibold">
        {t.setup.microphone}
      </label>
      <div className="mt-2 flex flex-col gap-3 sm:flex-row">
        <select
          id="microphone"
          value={mic.microphone}
          disabled={mic.checking || disabled || mic.microphones.length === 0}
          onChange={(event) => mic.choose(event.target.value)}
          className="h-12 min-w-0 border border-line bg-white px-3 focus-visible:border-ink focus-visible:outline-none disabled:bg-raised disabled:text-muted sm:flex-1"
        >
          {mic.microphones.length === 0 && <option value="">{t.setup.listMicrophones}</option>}
          {mic.microphones.map((device, index) => (
            <option key={device.deviceId} value={device.deviceId}>
              {device.label || t.setup.microphoneNumber(index + 1)}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={mic.checking || disabled}
          onClick={() => void mic.check()}
          className="inline-flex h-12 items-center justify-center gap-2 border border-ink px-5 font-semibold hover:bg-ink hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt disabled:opacity-60 disabled:hover:bg-transparent disabled:hover:text-ink"
        >
          <MicrophoneIcon className="size-5" />
          {mic.checking ? t.setup.checking : t.setup.checkMicrophone}
        </button>
      </div>
      <output className="mt-3 block text-[15px] text-muted">
        <StatusLine tone={micTone(mic.status)}>{t.setup.mic[mic.status]}</StatusLine>
      </output>
    </div>
  );
}
