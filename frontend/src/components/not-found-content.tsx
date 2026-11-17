"use client";

import { arrowMotion, buttonStyles } from "@/components/button-styles";
import { ArrowRightIcon } from "@/components/icons";
import { LocaleLink as Link } from "@/components/locale-link";
import { StatusPage } from "@/components/status-page";
import { useLocale } from "@/i18n/locale";

export function NotFoundContent() {
  const { t } = useLocale();
  return (
    <StatusPage
      code="404"
      label={t.status.notFoundLabel}
      title={t.status.notFoundTitle}
      text={t.status.notFoundText}
    >
      <Link href="/" className={`${buttonStyles.ink} sm:w-72`}>
        {t.status.home}
        <ArrowRightIcon className={arrowMotion} />
      </Link>
      <Link href="/practice" className={buttonStyles.outline}>
        {t.common.setTheRoom}
      </Link>
    </StatusPage>
  );
}
