"use client";

import { locales, setLocale, useLocale } from "@/i18n/locale";

const names = { pl: "PL", en: "EN" } as const;

export function LocaleSwitch() {
  const { locale, t } = useLocale();
  return (
    <fieldset className="flex border border-ink">
      <legend className="sr-only">{t.locale.label}</legend>
      {locales.map((option) => (
        <label
          key={option}
          className="grid h-[38px] w-11 place-items-center text-[13px] font-semibold not-first:border-l not-first:border-ink hover:bg-raised has-checked:bg-ink has-checked:text-white has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-cobalt"
        >
          <input
            type="radio"
            name="interface-language"
            value={option}
            checked={locale === option}
            onChange={() => setLocale(option)}
            className="sr-only"
          />
          <span aria-hidden="true">{names[option]}</span>
          <span className="sr-only">{option === "pl" ? "Polski" : "English"}</span>
        </label>
      ))}
    </fieldset>
  );
}
