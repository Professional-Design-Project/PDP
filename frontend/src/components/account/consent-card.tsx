"use client";

import { useState } from "react";
import { Loader } from "@/components/loader";
import { useLocale } from "@/i18n/locale";
import { withdrawConsent, type StoredConsent } from "@/lib/account";
import { consentKeys, noConsent, saveConsent } from "@/lib/consent";
import { formatDate } from "@/lib/format";
import { browserClient } from "@/lib/supabase/client";

type ConsentCardProps = {
  consent: StoredConsent | null;
  onChanged: () => void;
};

export function ConsentCard({ consent, onChanged }: ConsentCardProps) {
  const { locale, t } = useLocale();
  const [working, setWorking] = useState(false);
  const [failed, setFailed] = useState(false);

  async function withdraw() {
    const supabase = browserClient();
    if (!supabase || !consent) return;
    setWorking(true);
    setFailed(false);
    try {
      await withdrawConsent(supabase, consent.id);
      saveConsent(noConsent);
      onChanged();
    } catch {
      setFailed(true);
    } finally {
      setWorking(false);
    }
  }

  return (
    <section aria-labelledby="consent-title" className="border-t-2 border-ink pt-5">
      <h2 id="consent-title" className="text-[28px] leading-tight font-bold tracking-tight">
        {t.account.consentTitle}
      </h2>
      {!consent ? (
        <p className="mt-3 text-muted">{t.account.consentNone}</p>
      ) : (
        <>
          <p className="mt-3 text-muted">
            {consent.withdrawnAt
              ? t.account.consentWithdrawn(formatDate(consent.withdrawnAt, locale))
              : `${t.account.consentIntro} ${t.account.consentGiven(formatDate(consent.givenAt, locale))}`}
          </p>
          <ul className="mt-5 border-t border-line">
            {consentKeys.map((key) => (
              <li
                key={key}
                className="grid grid-cols-[1fr_4rem] gap-4 border-b border-line py-3 text-[15px]"
              >
                <span className="leading-snug">{t.consent.labels[key]}</span>
                <span className={`text-right font-semibold ${consent[key] ? "" : "text-muted"}`}>
                  {consent[key] ? t.account.yes : t.account.no}
                </span>
              </li>
            ))}
          </ul>
          {!consent.withdrawnAt && (
            <button
              type="button"
              onClick={() => void withdraw()}
              disabled={working}
              className="mt-5 inline-flex h-12 items-center gap-3 border border-ink px-5 font-semibold hover:bg-ink hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt disabled:opacity-60"
            >
              {working ? t.account.withdrawing : t.account.withdraw}
              {working && <Loader className="text-[16px]" />}
            </button>
          )}
          {failed && (
            <p role="alert" className="mt-3 text-[14px]">
              {t.account.failed}
            </p>
          )}
        </>
      )}
    </section>
  );
}
