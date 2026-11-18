"use client";

import { ProgressNote } from "@/components/history/progress-note";
import { ProgressTimeline } from "@/components/history/progress-timeline";
import { ProgressTotals } from "@/components/history/progress-totals";
import { useLocale } from "@/i18n/locale";
import {
  progressTimeline,
  progressTotals,
  type ProgressData,
  type ScenarioFilter,
} from "@/lib/progress";

type ProgressSectionProps = { data: ProgressData; filter: ScenarioFilter };

export function ProgressSection({ data, filter }: ProgressSectionProps) {
  const { t } = useLocale();
  const copy = t.history.progress;
  return (
    <section
      aria-labelledby="progress-title"
      className="mt-10 animate-fade border-t-2 border-ink pt-5"
    >
      <h2 id="progress-title" className="text-[32px] leading-tight font-bold tracking-tight">
        {copy.title}
      </h2>
      <p className="mt-2 max-w-2xl text-ink/80">{copy.intro}</p>
      <ProgressTotals totals={progressTotals(data, filter)} />
      <h3 className="mt-10 text-[22px] font-bold">{copy.timeline}</h3>
      <p className="mt-1 max-w-2xl text-[15px] text-muted">{copy.timelineIntro}</p>
      <ProgressTimeline steps={progressTimeline(data, filter)} />
      <ProgressNote />
    </section>
  );
}
