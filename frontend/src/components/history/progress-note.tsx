"use client";

import { useLocale } from "@/i18n/locale";

export function ProgressNote() {
  const { t } = useLocale();
  const copy = t.history.progress.note;
  return (
    <details className="group mt-6 border border-line bg-white p-5">
      <summary className="cursor-pointer font-semibold marker:text-cobalt focus-visible:outline-2 focus-visible:outline-cobalt">
        {copy.title}
      </summary>
      <ul className="mt-4 list-disc space-y-2 pl-5 text-[15px] leading-relaxed text-ink/80">
        {copy.points.map((point) => (
          <li key={point}>{point}</li>
        ))}
      </ul>
    </details>
  );
}
