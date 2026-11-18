"use client";

import { useState } from "react";
import { ReportCard } from "@/components/admin/report-card";
import { StatusFilter, type StatusFilterValue } from "@/components/admin/status-filter";
import { useLocale } from "@/i18n/locale";
import { countByStatus, type Report, type ReportStatus } from "@/lib/reports";

type ReportBoardProps = {
  reports: Report[];
  onStatus: (id: string, status: ReportStatus) => void;
  onDelete: (id: string) => void;
};

export function ReportBoard({ reports, onStatus, onDelete }: ReportBoardProps) {
  const { t } = useLocale();
  const [filter, setFilter] = useState<StatusFilterValue>("new");
  const shown = filter === "all" ? reports : reports.filter((report) => report.status === filter);

  return (
    <div className="mt-10 border-t-2 border-ink pt-6">
      <StatusFilter value={filter} counts={countByStatus(reports)} onChange={setFilter} />
      {shown.length === 0 ? (
        <p className="mt-8 text-muted">{t.admin.empty}</p>
      ) : (
        <ul className="mt-6 border-t border-line">
          {shown.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              onStatus={(status) => onStatus(report.id, status)}
              onDelete={() => onDelete(report.id)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
