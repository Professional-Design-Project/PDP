"use client";

import { formatClock, type TranscriptLine } from "@/components/session/session-state";
import { useLocale } from "@/i18n/locale";

export function TranscriptSection({ transcript }: { transcript: TranscriptLine[] }) {
  const { t } = useLocale();
  return (
    <section aria-labelledby="transcript-title" className="mt-16 border-t-2 border-ink pt-5">
      <h2 id="transcript-title" className="text-[32px] leading-tight font-bold tracking-tight">
        {t.summary.transcript}
      </h2>
      {transcript.length === 0 ? (
        <p className="mt-4 text-muted">{t.summary.empty}</p>
      ) : (
        <ol className="mt-6 border-t border-line">
          {transcript.map((line) => (
            <li
              key={line.id}
              id={`line-${line.id}`}
              className={`grid scroll-mt-24 grid-cols-[4rem_1fr] gap-4 border-b border-line px-4 py-5 target:outline-2 target:-outline-offset-2 target:outline-cobalt sm:grid-cols-[5rem_9rem_1fr] ${
                line.role === "user" ? "bg-raised" : "bg-white"
              }`}
            >
              <span className="text-[14px] text-muted tabular-nums">{formatClock(line.at)}</span>
              <span className="text-[15px] font-semibold max-sm:col-start-2">
                {line.role === "user" ? t.common.you : t.common.interviewer}
              </span>
              <p className="leading-relaxed max-sm:col-start-2">{line.text}</p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
