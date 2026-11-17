"use client";

import { useSwitchLocale } from "@/hooks/use-switch-locale";
import { dictionaries, locales, useLocale } from "@/i18n/locale";

export function LocaleSwitch() {
  const { locale, t } = useLocale();
  const switchLocale = useSwitchLocale();
  return (
    <fieldset className="flex border border-ink">
      <legend className="sr-only">{t.locale.label}</legend>
      {locales.map((option) => (
        <label
          key={option}
          lang={option}
          className="grid h-[38px] w-11 place-items-center text-[13px] font-semibold not-first:border-l not-first:border-ink hover:bg-raised has-checked:bg-ink has-checked:text-white has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-cobalt"
        >
          <input
            type="radio"
            name="interface-language"
            value={option}
            checked={locale === option}
            onChange={() => switchLocale(option)}
            className="sr-only"
          />
          <span aria-hidden="true">{dictionaries[option].locale.short}</span>
          <span className="sr-only">{dictionaries[option].locale.name}</span>
        </label>
      ))}
    </fieldset>
  );
}
