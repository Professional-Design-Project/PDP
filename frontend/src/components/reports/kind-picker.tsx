"use client";

import { useLocale } from "@/i18n/locale";
import { REPORT_KINDS, type ReportKind } from "@/lib/reports";

type KindPickerProps = {
  value: ReportKind;
  onChange: (value: ReportKind) => void;
};

export function KindPicker({ value, onChange }: KindPickerProps) {
  const { t } = useLocale();
  return (
    <fieldset>
      <legend className="font-semibold">{t.report.kindLabel}</legend>
      <div className="mt-3 flex flex-wrap gap-2">
        {REPORT_KINDS.map((kind) => (
          <label
            key={kind}
            className="cursor-pointer border border-ink px-4 py-2 text-[15px] font-semibold hover:bg-raised has-checked:bg-ink has-checked:text-white has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-cobalt"
          >
            <input
              type="radio"
              name="report-kind"
              value={kind}
              checked={value === kind}
              onChange={() => onChange(kind)}
              className="sr-only"
            />
            {t.report.kinds[kind]}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
