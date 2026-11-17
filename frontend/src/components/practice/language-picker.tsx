"use client";

import { useLocale, type Locale } from "@/i18n/locale";
import { conversationLanguages } from "@/lib/languages";

type LanguagePickerProps = {
  value: Locale;
  disabled: boolean;
  onChange: (value: Locale) => void;
};

export function LanguagePicker({ value, disabled, onChange }: LanguagePickerProps) {
  const { t } = useLocale();
  return (
    <fieldset disabled={disabled}>
      <legend className="font-semibold">{t.setup.conversationLanguage}</legend>
      <div className="mt-2 grid w-full grid-cols-2 sm:w-80">
        {conversationLanguages.map((option) => (
          <label
            key={option.value}
            className="flex h-12 items-center justify-center border border-ink text-[15px] font-semibold not-first:border-l-0 has-checked:bg-ink has-checked:text-white has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-cobalt has-disabled:opacity-60"
          >
            <input
              type="radio"
              name="language"
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
