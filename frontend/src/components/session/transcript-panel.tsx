"use client";

import { useEffect, useRef } from "react";
import { CloseIcon } from "@/components/icons";
import { formatClock, type TranscriptLine } from "@/components/session/session-state";
import { useLocale } from "@/i18n/locale";

type TranscriptPanelProps = {
  transcript: TranscriptLine[];
  onClose: () => void;
};

export function TranscriptPanel({ transcript, onClose }: TranscriptPanelProps) {
  const { t } = useLocale();
  const listRef = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [transcript.length]);

  return (
    <aside
      aria-label={t.live.transcript}
      className="absolute top-16 right-0 bottom-28 z-10 flex w-full animate-panel flex-col bg-canvas text-ink sm:w-[26rem] lg:static lg:inset-auto"
    >
      <div className="flex items-center justify-between border-b-2 border-ink px-6 py-5">
        <h2 className="text-[30px] leading-none font-bold tracking-[-0.03em]">
          {t.live.transcript}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label={t.live.closeTranscript}
          className="grid size-10 place-items-center hover:bg-raised focus-visible:outline-2 focus-visible:outline-cobalt"
        >
          <CloseIcon className="size-5" />
        </button>
      </div>
      <ol ref={listRef} className="min-h-0 flex-1 scroll-smooth overflow-y-auto">
        {transcript.length === 0 && (
          <li className="px-6 py-8 text-[15px] text-muted">{t.live.emptyTranscript}</li>
        )}
        {transcript.map((line) => (
          <li
            key={line.id}
            className={`grid grid-cols-[3.5rem_1fr] gap-3 border-b border-line px-6 py-5 ${
              line.role === "user" ? "bg-raised" : "bg-white"
            }`}
          >
            <span className="text-[14px] text-muted tabular-nums">{formatClock(line.at)}</span>
            <div>
              <p className="text-[14px] font-semibold">
                {line.role === "user" ? t.common.you : t.common.interviewer}
                {line.interrupted && (
                  <span className="font-normal text-muted">{t.live.interrupted}</span>
                )}
              </p>
              <p className="mt-1 leading-relaxed">{line.text}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="border-t border-line px-6 py-4 text-[13px] leading-relaxed text-muted">
        {t.live.panelNotice}
      </p>
    </aside>
  );
}
