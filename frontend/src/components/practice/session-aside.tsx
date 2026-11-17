"use client";

import { arrowMotion } from "@/components/button-styles";
import { ConsentPanel } from "@/components/consent-panel";
import { ArrowRightIcon } from "@/components/icons";
import { Loader } from "@/components/loader";
import { Rise } from "@/components/rise";
import { StatusLine } from "@/components/status-line";
import type { usePracticeConsent } from "@/hooks/use-practice-consent";
import type { ConnectionStatus } from "@/hooks/use-voice-session";
import { useLocale } from "@/i18n/locale";

type SessionAsideProps = {
  rows: [string, string][];
  consent: ReturnType<typeof usePracticeConsent>;
  locked: boolean;
  connecting: boolean;
  blocked: boolean;
  status: ConnectionStatus;
  failure: string | null;
  onEnter: () => void;
};

export function SessionAside({
  rows,
  consent,
  locked,
  connecting,
  blocked,
  status,
  failure,
  onEnter,
}: SessionAsideProps) {
  const { t } = useLocale();
  return (
    <Rise as="aside" delay={150} className="lg:sticky lg:top-8 lg:col-span-4 lg:self-start">
      <div className="bg-ink p-6 text-white">
        <h2 className="text-[28px] leading-tight font-bold tracking-tight">
          {t.setup.yourSession}
        </h2>
        <dl className="mt-5 text-[15px]">
          {rows.map(([term, value]) => (
            <div key={term} className="flex justify-between gap-6 border-t border-ink-line py-2.5">
              <dt className="text-ink-muted">{term}</dt>
              <dd className="truncate text-right">{value}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-6 border-t border-ink-line pt-5">
          <p className="font-semibold">{t.setup.aiNoticeTitle}</p>
          <p className="mt-2 text-[14px] leading-relaxed text-ink-muted">{t.setup.aiNoticeText}</p>
        </div>
      </div>

      <div className="border border-t-0 border-line bg-white p-6">
        <ConsentPanel choices={consent.choices} disabled={locked} onChange={consent.change} />
        <div className="mt-6 border-t border-line pt-6" />
        <button
          type="button"
          disabled={locked || !consent.allowed || blocked}
          onClick={onEnter}
          className={`group flex h-14 w-full items-center justify-between bg-cobalt px-5 text-lg font-semibold text-white hover:bg-cobalt/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:bg-raised disabled:text-muted ${connecting ? "disabled:cursor-wait" : "disabled:cursor-not-allowed"}`}
        >
          {connecting ? t.setup.connecting : t.setup.enter}
          {connecting ? (
            <Loader className="text-[22px]" />
          ) : (
            <ArrowRightIcon className={arrowMotion} />
          )}
        </button>
        <output className="mt-3 block text-[14px] text-muted">
          <StatusLine tone={failure !== null || !consent.allowed ? "bad" : "neutral"}>
            {consent.allowed ? t.setup.status[status] : t.setup.tickRequired}
          </StatusLine>
        </output>
        {failure !== null && (
          <p role="alert" className="mt-2 text-[14px] text-ink">
            {t.setup.startFailed(failure)}
          </p>
        )}
      </div>
    </Rise>
  );
}
