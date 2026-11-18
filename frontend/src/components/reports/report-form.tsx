"use client";

import { arrowMotion, buttonStyles } from "@/components/button-styles";
import { ArrowRightIcon } from "@/components/icons";
import { Loader } from "@/components/loader";
import { KindPicker } from "@/components/reports/kind-picker";
import { useReportForm } from "@/hooks/use-report-form";
import { useLocale } from "@/i18n/locale";
import { REPORT_MAX_LENGTH } from "@/lib/reports";

export function ReportForm() {
  const { t } = useLocale();
  const form = useReportForm();

  if (form.state === "sent") {
    return (
      <div className="animate-fade border-t-2 border-ink pt-6">
        <output className="block text-lg font-semibold">{t.report.sent}</output>
        <button
          type="button"
          onClick={form.reset}
          className="mt-4 font-semibold underline underline-offset-4 hover:text-cobalt"
        >
          {t.report.another}
        </button>
      </div>
    );
  }

  return (
    <form
      className="space-y-8 border-t-2 border-ink pt-6"
      onSubmit={(event) => {
        event.preventDefault();
        void form.submit();
      }}
    >
      <KindPicker value={form.kind} onChange={form.setKind} />
      <div>
        <div className="flex items-baseline justify-between gap-4">
          <label htmlFor="report-message" className="font-semibold">
            {t.report.messageLabel}
          </label>
          <span className="text-[13px] text-muted tabular-nums">
            {t.report.messageHint(REPORT_MAX_LENGTH - form.message.length)}
          </span>
        </div>
        <textarea
          id="report-message"
          required
          value={form.message}
          maxLength={REPORT_MAX_LENGTH}
          onChange={(event) => form.setMessage(event.target.value)}
          className="mt-2 block min-h-44 w-full resize-y border border-line bg-white p-4 focus-visible:border-ink focus-visible:outline-none"
        />
        <p className="mt-3 max-w-xl text-[14px] text-muted">{t.report.privacy}</p>
      </div>
      <button
        type="submit"
        disabled={!form.ready || form.state === "sending"}
        className={`${buttonStyles.ink} disabled:opacity-60 sm:w-72`}
      >
        {form.state === "sending" ? t.report.sending : t.report.send}
        {form.state === "sending" ? (
          <Loader className="text-[18px]" />
        ) : (
          <ArrowRightIcon className={arrowMotion} />
        )}
      </button>
      {form.state === "failed" && (
        <p role="alert" className="text-[15px]">
          {t.report.failed}
        </p>
      )}
    </form>
  );
}
