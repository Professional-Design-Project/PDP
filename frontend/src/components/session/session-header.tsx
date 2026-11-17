"use client";

import Image from "next/image";
import { formatClock } from "@/components/session/session-state";
import { useLocale } from "@/i18n/locale";

type SessionHeaderProps = {
  scenario: string;
  language: string;
  elapsed: number;
  live: boolean;
};

export function SessionHeader({ scenario, language, elapsed, live }: SessionHeaderProps) {
  const { t } = useLocale();
  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-ink-line px-4 sm:px-8">
      <Image src="/brand/logo-light.svg" alt="ensaio" width={88} height={31} />
      <p className="hidden text-[15px] text-ink-muted md:block">
        {scenario} / {language}
      </p>
      <div className="flex items-center gap-5">
        <p className="text-[28px] leading-none font-bold tracking-[-0.04em] tabular-nums">
          {formatClock(elapsed)}
          <span className="sr-only">{t.live.elapsed}</span>
        </p>
        <p className="inline-flex items-center gap-2 text-[15px]">
          <span
            aria-hidden="true"
            className={`size-2.5 ${live ? "animate-pulse bg-cobalt" : "bg-ink-muted"}`}
          />
          {live ? t.live.live : t.live.connecting}
        </p>
      </div>
    </header>
  );
}
