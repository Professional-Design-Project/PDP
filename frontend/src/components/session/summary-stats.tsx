"use client";

import { Rise } from "@/components/rise";
import { formatClock, type TranscriptLine } from "@/components/session/session-state";
import { useLocale } from "@/i18n/locale";

export function SummaryStats({
  duration,
  transcript,
}: {
  duration: number;
  transcript: TranscriptLine[];
}) {
  const { t } = useLocale();
  const questions = transcript.filter((line) => line.role === "assistant").length;
  const answers = transcript.filter((line) => line.role === "user").length;
  const numbers = [
    { value: formatClock(duration), label: t.summary.minutes },
    { value: String(questions), label: t.summary.questions(questions) },
    { value: String(answers), label: t.summary.answers(answers) },
  ];
  return (
    <Rise delay={100} className="mt-12 grid border-t-2 border-ink sm:grid-cols-3">
      {numbers.map((item) => (
        <div key={item.label} className="border-b border-line py-6 sm:pr-8">
          <p className="text-[56px] leading-none font-bold tracking-[-0.05em] tabular-nums sm:text-[72px]">
            {item.value}
          </p>
          <p className="mt-2 text-muted">{item.label}</p>
        </div>
      ))}
    </Rise>
  );
}
