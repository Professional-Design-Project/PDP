"use client";

import { useState } from "react";
import { useLocale } from "@/i18n/locale";
import { formatDate } from "@/lib/format";
import { REPORT_STATUSES, type Report, type ReportStatus } from "@/lib/reports";

type ReportCardProps = {
  report: Report;
  onStatus: (status: ReportStatus) => void;
  onDelete: () => void;
};

const control =
  "h-10 border border-ink px-3 text-[14px] font-semibold hover:bg-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt";

export function ReportCard({ report, onStatus, onDelete }: ReportCardProps) {
  const { locale, t } = useLocale();
  const [confirming, setConfirming] = useState(false);
  const statusId = `status-${report.id}`;

  return (
    <li className="grid gap-4 border-b border-line py-6 lg:grid-cols-12 lg:gap-8">
      <div className="lg:col-span-3">
        <p className="text-[14px] font-semibold">{t.report.kinds[report.kind]}</p>
        <p className="mt-1 text-[14px] text-muted">{formatDate(report.createdAt, locale)}</p>
        <p className="mt-1 truncate text-[14px] text-muted" title={report.email ?? undefined}>
          {t.admin.from}: {report.email ?? t.admin.unknownAuthor}
        </p>
      </div>
      <p className="leading-relaxed break-words whitespace-pre-wrap lg:col-span-6">
        {report.message}
      </p>
      <div className="flex flex-wrap items-start gap-2 lg:col-span-3 lg:justify-end">
        <label htmlFor={statusId} className="sr-only">
          {t.admin.statusLabel}
        </label>
        <select
          id={statusId}
          value={report.status}
          onChange={(event) => onStatus(event.target.value as ReportStatus)}
          className={`${control} bg-white`}
        >
          {REPORT_STATUSES.map((status) => (
            <option key={status} value={status}>
              {t.admin.statuses[status]}
            </option>
          ))}
        </select>
        {confirming ? (
          <>
            <button
              type="button"
              onClick={onDelete}
              className={`${control} bg-ink text-white hover:bg-ink/85`}
            >
              {t.admin.confirmDelete}
            </button>
            <button type="button" onClick={() => setConfirming(false)} className={control}>
              {t.admin.cancel}
            </button>
          </>
        ) : (
          <button type="button" onClick={() => setConfirming(true)} className={control}>
            {t.admin.delete}
          </button>
        )}
      </div>
    </li>
  );
}
