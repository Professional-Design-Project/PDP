"use client";

import type { Ref } from "react";
import { Loader } from "@/components/loader";
import { PersonaPortrait } from "@/components/persona-portrait";
import { SpeakingBars } from "@/components/speaking-bars";
import { useLocale } from "@/i18n/locale";

type InterviewerCardProps = {
  live: boolean;
  speaking: boolean;
  headingRef: Ref<HTMLHeadingElement>;
};

export function InterviewerCard({ live, speaking, headingRef }: InterviewerCardProps) {
  const { t } = useLocale();
  const label = !live ? t.live.joining : speaking ? t.common.speaking : t.common.listening;
  return (
    <div className="flex items-center gap-5 border-b border-ink-line pb-8 sm:gap-8">
      <div
        className={`size-24 shrink-0 outline-4 outline-offset-0 transition-[outline-color] duration-500 sm:size-36 ${
          speaking ? "outline-cobalt" : "outline-transparent"
        }`}
      >
        <PersonaPortrait tint="slate" className="size-full" />
      </div>
      <div className="min-w-0">
        <h2
          id="session-title"
          ref={headingRef}
          tabIndex={-1}
          className="text-[32px] leading-none font-bold tracking-[-0.03em] outline-none sm:text-[48px]"
        >
          {t.common.interviewer}
        </h2>
        <p className="mt-2 text-ink-muted">{t.live.notHuman}</p>
        <p className="mt-3 inline-flex items-center gap-2 text-[15px]" aria-live="polite">
          {speaking ? (
            <SpeakingBars className="text-cobalt" />
          ) : !live ? (
            <Loader className="text-[18px] text-ink-muted" />
          ) : (
            <span aria-hidden="true" className="size-2.5 bg-persona-sage" />
          )}
          {label}
        </p>
      </div>
    </div>
  );
}
