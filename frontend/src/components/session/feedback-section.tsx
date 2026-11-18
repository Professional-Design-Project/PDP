"use client";

import { Loader } from "@/components/loader";
import {
  formatClock,
  type FeedbackState,
  type TranscriptLine,
} from "@/components/session/session-state";
import { useLocale } from "@/i18n/locale";

type FeedbackSectionProps = {
  state: FeedbackState;
  transcript: TranscriptLine[];
  onRequest: () => void;
};

function moment(sequence: number | null, transcript: TranscriptLine[]) {
  const line = transcript.find((item) => item.id === String(sequence));
  return line ? { id: line.id, at: formatClock(line.at) } : null;
}

export function FeedbackSection({ state, transcript, onRequest }: FeedbackSectionProps) {
  const { t } = useLocale();
  return (
    <section
      aria-labelledby="feedback-title"
      aria-busy={state.status === "loading"}
      className="mt-16"
    >
      <div className="grid gap-4 border-t-2 border-ink pt-5 lg:grid-cols-12 lg:gap-8">
        <h2
          id="feedback-title"
          className="text-[32px] leading-tight font-bold tracking-tight lg:col-span-7"
        >
          {t.feedback.title}
        </h2>
        <p className="max-w-md text-[15px] leading-relaxed text-muted lg:col-span-5">
          {t.feedback.notice}
        </p>
      </div>

      {(state.status === "undecided" || state.status === "declined") && (
        <div className="mt-8 flex animate-caption flex-col gap-5 border border-line bg-white p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <p className="max-w-lg text-lg leading-snug">
            {state.status === "declined" ? t.feedback.declined : t.feedback.offer}
          </p>
          <button
            type="button"
            onClick={onRequest}
            className="h-12 shrink-0 bg-cobalt px-6 font-semibold text-white hover:bg-cobalt/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            {t.feedback.get}
          </button>
        </div>
      )}

      {state.status === "loading" && (
        <div className="mt-8">
          <output className="inline-flex items-center gap-3 text-[15px] text-muted">
            <Loader className="text-[18px] text-cobalt" />
            {t.feedback.reading}
          </output>
          <div
            className="mt-5 grid border-t border-l border-line md:grid-cols-3"
            aria-hidden="true"
          >
            {[0, 1, 2].map((index) => (
              <div key={index} className="space-y-3 border-r border-b border-line bg-white p-6">
                <div
                  className="h-4 w-1/3 animate-pulse bg-raised"
                  style={{ animationDelay: `${index * 150}ms` }}
                />
                <div
                  className="h-6 w-full animate-pulse bg-raised"
                  style={{ animationDelay: `${index * 150 + 80}ms` }}
                />
                <div
                  className="h-6 w-4/5 animate-pulse bg-raised"
                  style={{ animationDelay: `${index * 150 + 160}ms` }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {state.status === "unavailable" && (
        <p className="mt-8 animate-caption text-lg text-ink/80">{t.feedback.unavailable}</p>
      )}

      {state.status === "failed" && (
        <div className="mt-8 flex animate-caption flex-col gap-4 sm:flex-row sm:items-center">
          <p role="alert" className="text-lg text-ink/80">
            {state.reason ? t.feedback.errors[state.reason] : t.feedback.failed}
          </p>
          <button
            type="button"
            onClick={onRequest}
            className="h-12 border border-ink px-5 font-semibold hover:bg-ink hover:text-white focus-visible:outline-2 focus-visible:outline-cobalt"
          >
            {t.feedback.retry}
          </button>
        </div>
      )}

      {state.status === "ready" && (
        <div className="mt-8">
          <p className="max-w-3xl animate-caption text-[24px] leading-snug font-medium tracking-tight">
            {state.result.summary}
          </p>
          <ul className="mt-8 grid border-t border-l border-line md:grid-cols-3">
            {state.result.notes.map((note, index) => {
              const focus =
                note.kind === "work_on" &&
                state.result.notes.findIndex((item) => item.kind === "work_on") === index;
              const at = moment(note.sequence, transcript);
              return (
                <li
                  key={`${note.title}-${index}`}
                  className={`flex animate-caption flex-col border-r border-b p-6 sm:p-7 ${
                    focus ? "border-cobalt bg-cobalt text-white" : "border-line bg-white"
                  }`}
                  style={{ animationDelay: `${index * 60}ms` }}
                >
                  <p className={`text-[14px] font-semibold ${focus ? "" : "text-muted"}`}>
                    {note.kind === "strength" ? t.feedback.keep : t.feedback.work}
                  </p>
                  <p className="mt-3 text-lg font-bold">{note.title}</p>
                  <blockquote className="mt-3 text-[20px] leading-snug font-medium tracking-tight">
                    {t.common.quote(note.quote)}
                  </blockquote>
                  <p className={`mt-4 leading-relaxed ${focus ? "text-white/90" : "text-ink/80"}`}>
                    {note.advice}
                  </p>
                  {at && (
                    <a
                      href={`#line-${at.id}`}
                      className={`mt-auto border-t pt-4 text-[14px] font-semibold ${
                        focus
                          ? "border-white/30 hover:text-white/80"
                          : "border-line hover:text-cobalt"
                      }`}
                    >
                      {t.feedback.at(at.at)}
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}
