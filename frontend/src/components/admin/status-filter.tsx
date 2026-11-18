"use client";

import { useLocale } from "@/i18n/locale";
import { REPORT_STATUSES, type ReportStatus } from "@/lib/reports";

export type StatusFilterValue = ReportStatus | "all";

type StatusFilterProps = {
  value: StatusFilterValue;
  counts: Record<ReportStatus, number>;
  onChange: (value: StatusFilterValue) => void;
};

export function StatusFilter({ value, counts, onChange }: StatusFilterProps) {
  const { t } = useLocale();
  const total = REPORT_STATUSES.reduce((sum, status) => sum + counts[status], 0);
  const options: StatusFilterValue[] = ["all", ...REPORT_STATUSES];
  return (
    <fieldset className="flex flex-wrap gap-2">
      <legend className="sr-only">{t.admin.filter}</legend>
      {options.map((option) => (
        <label
          key={option}
          className="cursor-pointer border border-ink px-4 py-2 text-[14px] font-semibold hover:bg-raised has-checked:bg-ink has-checked:text-white has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-cobalt"
        >
          <input
            type="radio"
            name="status-filter"
            value={option}
            checked={value === option}
            onChange={() => onChange(option)}
            className="sr-only"
          />
          {option === "all" ? t.admin.all : t.admin.statuses[option]}
          <span className="ml-2 tabular-nums opacity-70">
            {option === "all" ? total : counts[option]}
          </span>
        </label>
      ))}
    </fieldset>
  );
}
