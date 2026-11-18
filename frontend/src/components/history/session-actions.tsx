"use client";

import { arrowMotion, buttonStyles } from "@/components/button-styles";
import { ArrowRightIcon, FileIcon } from "@/components/icons";
import { LocaleLink as Link } from "@/components/locale-link";
import { useLocale } from "@/i18n/locale";
import { downloadFile } from "@/lib/download";
import type { PastSessionDetail } from "@/lib/history";
import { PRESET_PARAM } from "@/lib/practice-preset";
import { printWithTitle } from "@/lib/print-session";
import { markdownFilename, sessionMarkdown, sessionTitle } from "@/lib/session-markdown";

export function SessionActions({ session }: { session: PastSessionDetail }) {
  const { locale, t } = useLocale();

  function downloadPdf() {
    printWithTitle(sessionTitle(session, t, locale));
  }

  function downloadMarkdown() {
    downloadFile(
      sessionMarkdown(session, t, locale),
      markdownFilename(session),
      "text/markdown;charset=utf-8",
    );
  }

  return (
    <div className="mt-10 print:hidden">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Link
          href={`/practice?${PRESET_PARAM}=${session.id}`}
          className={`${buttonStyles.ink} sm:w-72`}
        >
          {t.history.again}
          <ArrowRightIcon className={arrowMotion} />
        </Link>
        <button type="button" onClick={downloadPdf} className={`${buttonStyles.outline} sm:w-64`}>
          {t.history.pdf}
          <FileIcon className="size-5 shrink-0" />
        </button>
        <button
          type="button"
          onClick={downloadMarkdown}
          className={`${buttonStyles.outline} sm:w-64`}
        >
          {t.history.markdown}
          <FileIcon className="size-5 shrink-0" />
        </button>
      </div>
      <p className="mt-3 text-[14px] text-muted">{t.history.pdfHint}</p>
    </div>
  );
}
