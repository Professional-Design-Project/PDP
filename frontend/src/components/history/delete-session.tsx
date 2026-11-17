"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader } from "@/components/loader";
import { useLocale } from "@/i18n/locale";
import { localePath } from "@/i18n/paths";
import { deleteSession } from "@/lib/history";
import { browserClient } from "@/lib/supabase/client";

export function DeleteSession({ id }: { id: string }) {
  const { locale, t } = useLocale();
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [working, setWorking] = useState(false);
  const [failed, setFailed] = useState(false);

  async function remove() {
    const supabase = browserClient();
    if (!supabase) return;
    setWorking(true);
    setFailed(false);
    try {
      await deleteSession(supabase, id);
      router.replace(localePath(locale, "/history"));
    } catch {
      setFailed(true);
      setWorking(false);
    }
  }

  return (
    <section aria-labelledby="delete-session-title" className="mt-16 border-t-2 border-ink pt-5">
      <h2 id="delete-session-title" className="text-[28px] leading-tight font-bold tracking-tight">
        {t.history.deleteTitle}
      </h2>
      <p className="mt-3 max-w-xl text-muted">{t.history.deleteText}</p>
      <div className="mt-5 flex flex-wrap gap-3">
        {confirming ? (
          <>
            <button
              type="button"
              onClick={() => void remove()}
              disabled={working}
              className="inline-flex h-12 items-center gap-3 bg-ink px-5 font-semibold text-white hover:bg-ink/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt disabled:opacity-60"
            >
              {working ? t.history.deleting : t.history.deleteConfirm}
              {working && <Loader className="text-[16px]" />}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              disabled={working}
              className="h-12 border border-ink px-5 font-semibold hover:bg-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt"
            >
              {t.history.deleteCancel}
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="h-12 border border-ink px-5 font-semibold hover:bg-ink hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt"
          >
            {t.history.deleteButton}
          </button>
        )}
      </div>
      {failed && (
        <p role="alert" className="mt-3 text-[14px]">
          {t.history.deleteFailed}
        </p>
      )}
    </section>
  );
}
