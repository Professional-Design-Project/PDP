"use client";

import type { Dictionary } from "@/i18n/en";
import { dictionaries, locales, useLocale } from "@/i18n/locale";

type StableLabelProps = {
  pick: (t: Dictionary) => string;
};

export function StableLabel({ pick }: StableLabelProps) {
  const { locale } = useLocale();
  return (
    <span className="inline-grid justify-items-center">
      {locales.map((option) => (
        <span
          key={option}
          aria-hidden={option !== locale}
          className={`col-start-1 row-start-1 whitespace-nowrap ${option === locale ? "" : "invisible"}`}
        >
          {pick(dictionaries[option])}
        </span>
      ))}
    </span>
  );
}
