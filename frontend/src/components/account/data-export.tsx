"use client";

import { useState } from "react";
import { Loader } from "@/components/loader";
import { useAuth } from "@/hooks/use-auth";
import { useLocale } from "@/i18n/locale";
import { collectExport, downloadJson } from "@/lib/data-export";
import { browserClient } from "@/lib/supabase/client";

export function DataExport() {
  const { t } = useLocale();
  const { user } = useAuth();
  const [working, setWorking] = useState(false);
  const [failed, setFailed] = useState(false);

  async function download() {
    const supabase = browserClient();
    if (!supabase || !user) return;
    setWorking(true);
    setFailed(false);
    try {
      const data = await collectExport(supabase, user);
      downloadJson(data, `ensaio-data-${data.exportedAt.slice(0, 10)}.json`);
    } catch {
      setFailed(true);
    } finally {
      setWorking(false);
    }
  }

  return (
    <section aria-labelledby="export-title" className="border-t-2 border-ink pt-5">
      <h2 id="export-title" className="text-[28px] leading-tight font-bold tracking-tight">
        {t.account.exportTitle}
      </h2>
      <p className="mt-3 max-w-xl text-muted">{t.account.exportText}</p>
      <button
        type="button"
        onClick={() => void download()}
        disabled={working || !user}
        className="mt-5 inline-flex h-12 items-center gap-3 border border-ink px-5 font-semibold hover:bg-ink hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt disabled:opacity-60"
      >
        {working ? t.account.exporting : t.account.exportButton}
        {working && <Loader className="text-[16px]" />}
      </button>
      {failed && (
        <p role="alert" className="mt-3 text-[14px]">
          {t.account.exportFailed}
        </p>
      )}
    </section>
  );
}
