"use client";

import { DeleteSession } from "@/components/history/delete-session";
import { SessionActions } from "@/components/history/session-actions";
import { SessionRecording } from "@/components/history/session-recording";
import { LocaleLink as Link } from "@/components/locale-link";
import { Rise } from "@/components/rise";
import { FeedbackSection } from "@/components/session/feedback-section";
import { SummaryStats } from "@/components/session/summary-stats";
import { TranscriptSection } from "@/components/session/transcript-section";
import { useLocale } from "@/i18n/locale";
import { formatDate } from "@/lib/format";
import type { PastSessionDetail } from "@/lib/history";
import { languageName } from "@/lib/languages";

export function SessionDetail({ session }: { session: PastSessionDetail }) {
  const { locale, t } = useLocale();
  return (
    <>
      <Link
        href="/history"
        className="text-[15px] font-semibold underline underline-offset-4 hover:text-cobalt print:hidden"
      >
        {t.history.back}
      </Link>
      <div className="mt-8 grid gap-6 lg:grid-cols-12 lg:items-end lg:gap-8">
        <Rise
          as="h1"
          className="text-[48px] leading-[0.95] font-bold tracking-[-0.04em] sm:text-[80px] lg:col-span-7"
        >
          {t.scenarios[session.scenarioId].title}
        </Rise>
        <Rise as="p" delay={50} className="text-lg text-ink/80 lg:col-span-5">
          {formatDate(session.createdAt, locale)} · {languageName(session.language)}
        </Rise>
      </div>
      <SessionActions session={session} />
      <SummaryStats duration={session.duration} transcript={session.transcript} />
      {session.feedback ? (
        <FeedbackSection
          state={{ status: "ready", result: session.feedback }}
          transcript={session.transcript}
          onRequest={() => undefined}
        />
      ) : (
        <p className="mt-16 border-t-2 border-ink pt-5 text-muted">{t.history.feedbackMissing}</p>
      )}
      <SessionRecording sessionId={session.id} transcript={session.transcript} />
      <TranscriptSection transcript={session.transcript} />
      <div className="print:hidden">
        <DeleteSession id={session.id} />
      </div>
    </>
  );
}
