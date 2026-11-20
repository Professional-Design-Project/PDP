"use client";

import { useState } from "react";
import { EndChoices, type EndChoice } from "@/components/session/end-choices";
import { useModalDialog } from "@/hooks/use-modal-dialog";
import { useLocale } from "@/i18n/locale";

type FinishedPanelProps = {
  canRecord: boolean;
  onChoose: (choice: EndChoice) => void;
};

export function FinishedPanel({ canRecord, onChoose }: FinishedPanelProps) {
  const { t } = useLocale();
  const { dialogRef, focusRef } = useModalDialog<HTMLButtonElement>();
  const [choice, setChoice] = useState<EndChoice>({ feedback: true, recording: false });

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="finished-title"
      onCancel={(event) => event.preventDefault()}
      className="fixed inset-0 z-50 m-0 h-dvh max-h-none w-full max-w-none animate-fade items-end bg-ink/70 p-0 backdrop:bg-transparent open:flex sm:items-center sm:justify-center"
    >
      <section className="max-h-dvh w-full animate-panel overflow-y-auto bg-canvas p-6 text-ink sm:max-w-lg sm:p-8">
        <h2 id="finished-title" className="text-[32px] leading-none font-bold tracking-[-0.03em]">
          {t.finished.title}
        </h2>
        <p className="mt-3 leading-relaxed text-ink/80">{t.finished.text}</p>
        <EndChoices value={choice} canRecord={canRecord} onChange={setChoice} />
        <button
          ref={focusRef}
          type="button"
          onClick={() => onChoose({ ...choice, recording: canRecord && choice.recording })}
          className="mt-6 h-14 w-full bg-cobalt px-5 text-left text-lg font-semibold text-white hover:bg-cobalt/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          {t.finished.confirm}
        </button>
      </section>
    </dialog>
  );
}
