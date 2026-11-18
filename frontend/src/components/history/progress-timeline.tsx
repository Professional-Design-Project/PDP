"use client";

import { LocaleLink as Link } from "@/components/locale-link";
import { useLocale } from "@/i18n/locale";
import { formatDate } from "@/lib/format";
import type { ProgressStep } from "@/lib/progress";

function Titles({ label, items, tone }: { label: string; items: string[]; tone: string }) {
  return (
    <div>
      <p className="flex items-center gap-2 text-[13px] font-semibold">
        <span aria-hidden="true" className={`size-2 ${tone}`} />
        {label}
      </p>
      {items.length ? (
        <ul className="mt-1.5 space-y-1 text-[15px] leading-snug">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-1.5 text-[15px] text-muted">-</p>
      )}
    </div>
  );
}

export function ProgressTimeline({ steps }: { steps: ProgressStep[] }) {
  const { locale, t } = useLocale();
  const copy = t.history.progress;
  if (!steps.length) return <p className="mt-6 text-muted">{copy.noFeedback}</p>;
  return (
    <ol className="mt-6 border-t border-line">
      {steps.map((step) => (
        <li
          key={step.id}
          className="grid gap-4 border-b border-line py-5 sm:grid-cols-[14rem_1fr_1fr] sm:gap-8"
        >
          <Link
            href={`/history/${step.id}`}
            className="self-start hover:text-cobalt focus-visible:outline-2 focus-visible:outline-cobalt"
          >
            <span className="block font-bold">{t.scenarios[step.scenarioId].title}</span>
            <span className="text-[14px] text-muted">{formatDate(step.createdAt, locale)}</span>
          </Link>
          <Titles label={copy.strengths} items={step.strengths} tone="bg-persona-sage" />
          <Titles label={copy.workOn} items={step.workOn} tone="bg-persona-amber" />
        </li>
      ))}
    </ol>
  );
}
