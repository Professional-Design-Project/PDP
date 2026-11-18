"use client";

import { CloseIcon } from "@/components/icons";
import { useLocale } from "@/i18n/locale";
import { formatDate } from "@/lib/format";
import type { PracticePreset } from "@/lib/practice-preset";

type PresetNoticeProps = { preset: PracticePreset; onDismiss: () => void };

export function PresetNotice({ preset, onDismiss }: PresetNoticeProps) {
  const { locale, t } = useLocale();
  return (
    <aside
      aria-live="polite"
      className="mt-10 flex animate-fade items-start justify-between gap-4 border-l-4 border-cobalt bg-white p-5"
    >
      <div>
        <p className="font-semibold">
          {t.setup.preset.title(formatDate(preset.createdAt, locale))}
        </p>
        <p className="mt-1 text-[15px] text-ink/80">{t.setup.preset.text}</p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label={t.setup.preset.dismiss}
        className="shrink-0 p-1 text-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-cobalt"
      >
        <CloseIcon className="size-5" />
      </button>
    </aside>
  );
}
