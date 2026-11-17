"use client";

import { useEffect } from "react";
import { buttonStyles } from "@/components/button-styles";
import { LocaleLink as Link } from "@/components/locale-link";
import { StatusPage } from "@/components/status-page";
import { useLocale } from "@/i18n/locale";

export default function ErrorPage({ error, retry }: { error: unknown; retry: () => void }) {
  const { t } = useLocale();
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <StatusPage
      code="500"
      label={t.status.errorLabel}
      title={t.status.errorTitle}
      text={t.status.errorText}
    >
      <button type="button" onClick={() => retry()} className={`${buttonStyles.ink} sm:w-64`}>
        {t.status.retry}
      </button>
      <Link href="/" className={buttonStyles.outline}>
        {t.status.home}
      </Link>
    </StatusPage>
  );
}
