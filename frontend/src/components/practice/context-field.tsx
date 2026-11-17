"use client";

import { useLocale } from "@/i18n/locale";

export const CONTEXT_LIMIT = 2000;

type ContextFieldProps = {
  value: string;
  placeholder: string;
  disabled: boolean;
  onChange: (value: string) => void;
  onPasteFiles: (files: File[]) => void;
};

export function ContextField({
  value,
  placeholder,
  disabled,
  onChange,
  onPasteFiles,
}: ContextFieldProps) {
  const { t } = useLocale();
  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <label htmlFor="context" className="font-semibold">
          {t.setup.contextLabel}
        </label>
        <span className="text-[13px] text-muted tabular-nums">
          {value.length} / {CONTEXT_LIMIT}
        </span>
      </div>
      <textarea
        id="context"
        value={value}
        maxLength={CONTEXT_LIMIT}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        onPaste={(event) => {
          const files = Array.from(event.clipboardData.files);
          if (!files.length) return;
          event.preventDefault();
          onPasteFiles(files);
        }}
        placeholder={placeholder}
        className="mt-2 block min-h-36 w-full resize-y border border-line bg-white p-4 placeholder:text-muted/80 focus-visible:border-ink focus-visible:outline-none disabled:bg-raised disabled:text-muted"
      />
    </div>
  );
}
