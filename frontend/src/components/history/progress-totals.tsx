"use client";

import { formatClock } from "@/components/session/session-state";
import { useLocale } from "@/i18n/locale";
import type { ProgressTotals as Totals } from "@/lib/progress";

export function ProgressTotals({ totals }: { totals: Totals }) {
  const { t } = useLocale();
  const copy = t.history.progress;
  const numbers = [
    { value: String(totals.sessions), label: copy.sessions(totals.sessions) },
    { value: formatClock(totals.seconds), label: copy.time },
    { value: String(totals.answers), label: copy.answers(totals.answers) },
    { value: String(totals.wordsPerAnswer), label: copy.words },
  ];
  return (
    <div className="mt-6 grid border-t border-line sm:grid-cols-2 lg:grid-cols-4">
      {numbers.map((item) => (
        <div key={item.label} className="border-b border-line py-5 sm:pr-6">
          <p className="text-[44px] leading-none font-bold tracking-[-0.05em] tabular-nums">
            {item.value}
          </p>
          <p className="mt-2 text-[15px] text-muted">{item.label}</p>
        </div>
      ))}
    </div>
  );
}
