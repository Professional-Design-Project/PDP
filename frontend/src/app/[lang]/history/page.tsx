"use client";

import { LocaleLink as Link } from "@/components/locale-link";
import { buttonStyles } from "@/components/button-styles";
import { HistoryOverview } from "@/components/history/history-overview";
import { ErrorLine, LoadingLine, RequireAccounts } from "@/components/page-state";
import { Rise } from "@/components/rise";
import { useSupabaseQuery } from "@/hooks/use-supabase-query";
import { useLocale } from "@/i18n/locale";
import { listSessions } from "@/lib/history";

function HistoryView() {
  const { t } = useLocale();
  const { state } = useSupabaseQuery(listSessions, "sessions");
  return (
    <main className="mx-auto max-w-7xl px-4 pt-12 pb-24 sm:px-8 sm:pt-16">
      <div className="grid gap-6 lg:grid-cols-12 lg:items-end lg:gap-8">
        <Rise
          as="h1"
          className="text-5xl leading-none font-bold tracking-[-0.04em] sm:text-7xl lg:col-span-7"
        >
          {t.history.title}
        </Rise>
        <Rise as="p" delay={50} className="max-w-md text-lg text-ink/80 lg:col-span-5">
          {t.history.intro}
        </Rise>
      </div>
      {state.status === "loading" && <LoadingLine label={t.history.loading} />}
      {state.status === "error" && <ErrorLine message={t.history.failed} />}
      {state.status === "ready" && state.data.length === 0 && (
        <div className="mt-10 animate-fade border-t-2 border-ink pt-6">
          <p className="text-lg text-ink/80">{t.history.empty}</p>
          <Link href="/practice" className={`${buttonStyles.ink} mt-6 sm:w-72`}>
            {t.history.start}
          </Link>
        </div>
      )}
      {state.status === "ready" && state.data.length > 0 && (
        <HistoryOverview sessions={state.data} />
      )}
    </main>
  );
}

export default function HistoryPage() {
  return (
    <RequireAccounts>
      <HistoryView />
    </RequireAccounts>
  );
}
