"use client";

import { LocaleLink as Link } from "@/components/locale-link";
import { SessionDetail } from "@/components/history/session-detail";
import { ErrorLine, LoadingLine, RequireAccounts } from "@/components/page-state";
import { useSupabaseQuery } from "@/hooks/use-supabase-query";
import { useLocale } from "@/i18n/locale";
import { loadSession } from "@/lib/history";

function Entry({ id }: { id: string }) {
  const { t } = useLocale();
  const { state } = useSupabaseQuery((supabase) => loadSession(supabase, id), id);
  return (
    <main className="mx-auto max-w-7xl px-4 pt-12 pb-24 sm:px-8 sm:pt-16">
      {state.status === "loading" && <LoadingLine label={t.history.loading} />}
      {state.status === "error" && <ErrorLine message={t.history.failed} />}
      {state.status === "ready" && !state.data && (
        <>
          <ErrorLine message={t.history.notFound} />
          <Link
            href="/history"
            className="mt-6 block font-semibold underline underline-offset-4 hover:text-cobalt"
          >
            {t.history.back}
          </Link>
        </>
      )}
      {state.status === "ready" && state.data && <SessionDetail session={state.data} />}
    </main>
  );
}

export function HistoryEntry({ id }: { id: string }) {
  return (
    <RequireAccounts>
      <Entry id={id} />
    </RequireAccounts>
  );
}
