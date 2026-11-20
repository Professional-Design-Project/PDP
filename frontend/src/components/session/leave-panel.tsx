"use client";

import { useEffect, useRef, useState } from "react";
import { EndChoices, type EndChoice } from "@/components/session/end-choices";
import { useLocale } from "@/i18n/locale";

export type LeaveChoice = EndChoice;

type LeavePanelProps = {
  canRecord: boolean;
  onLeave: (choice: LeaveChoice) => void;
  onStay: () => void;
};

export function LeavePanel({ canRecord, onLeave, onStay }: LeavePanelProps) {
  const { t } = useLocale();
  const firstRef = useRef<HTMLButtonElement>(null);
  const [choice, setChoice] = useState<EndChoice>({ feedback: true, recording: false });

  useEffect(() => {
    firstRef.current?.focus();
  }, []);

  return (
    <div className="absolute inset-0 z-20 flex animate-fade items-end bg-ink/70 sm:items-center sm:justify-center">
      <section
        aria-labelledby="leave-title"
        className="max-h-dvh w-full animate-panel overflow-y-auto bg-canvas p-6 text-ink sm:max-w-lg sm:p-8"
      >
        <h2 id="leave-title" className="text-[32px] leading-none font-bold tracking-[-0.03em]">
          {t.leave.title}
        </h2>
        <p className="mt-3 leading-relaxed text-ink/80">{t.leave.text}</p>
        <EndChoices value={choice} canRecord={canRecord} onChange={setChoice} />
        <div className="mt-6 grid gap-3">
          <button
            ref={firstRef}
            type="button"
            onClick={() => onLeave({ ...choice, recording: canRecord && choice.recording })}
            className="h-14 bg-cobalt px-5 text-left text-lg font-semibold text-white hover:bg-cobalt/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            {t.leave.confirm}
          </button>
          <button
            type="button"
            onClick={onStay}
            className="h-12 justify-self-start px-1 font-semibold underline underline-offset-4 hover:text-cobalt focus-visible:outline-2 focus-visible:outline-cobalt"
          >
            {t.leave.stay}
          </button>
        </div>
      </section>
    </div>
  );
}
