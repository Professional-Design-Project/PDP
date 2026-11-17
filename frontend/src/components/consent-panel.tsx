"use client";

import Link from "next/link";
import { consentKeys, requiredConsents, type ConsentChoices, type ConsentKey } from "@/lib/consent";
import { useLocale } from "@/i18n/locale";

type ConsentPanelProps = {
  choices: ConsentChoices;
  disabled: boolean;
  onChange: (key: ConsentKey, value: boolean) => void;
};

export function ConsentPanel({ choices, disabled, onChange }: ConsentPanelProps) {
  const { t } = useLocale();
  return (
    <fieldset disabled={disabled}>
      <legend className="font-semibold">{t.consent.title}</legend>
      <p className="mt-2 text-[13px] leading-relaxed text-muted">{t.consent.intro}</p>
      <ul className="mt-4 space-y-3">
        {consentKeys.map((key) => {
          const required = requiredConsents.includes(key);
          return (
            <li key={key}>
              <label className="group flex gap-3 text-[14px] leading-snug">
                <span className="relative mt-0.5 grid size-5 shrink-0 place-items-center">
                  <input
                    type="checkbox"
                    checked={choices[key]}
                    onChange={(event) => onChange(key, event.target.checked)}
                    className="peer size-5 appearance-none border border-ink bg-white transition-colors duration-200 checked:border-cobalt checked:bg-cobalt focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt disabled:opacity-60"
                  />
                  <svg
                    viewBox="0 0 16 16"
                    aria-hidden="true"
                    className="pointer-events-none absolute size-3.5 scale-50 text-white opacity-0 transition duration-200 ease-(--ease-soft) peer-checked:scale-100 peer-checked:opacity-100"
                  >
                    <path d="M3 8.5l3 3 7-7" fill="none" stroke="currentColor" strokeWidth="2.2" />
                  </svg>
                </span>
                <span>
                  {t.consent.labels[key]}{" "}
                  <span className="text-muted">
                    {required ? t.consent.required : t.consent.optional}
                  </span>
                </span>
              </label>
            </li>
          );
        })}
      </ul>
      <p className="mt-4 text-[13px] leading-relaxed text-muted">
        {t.consent.outro}{" "}
        <Link
          href="/privacy"
          className="font-semibold text-ink underline underline-offset-2 hover:text-cobalt focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt"
        >
          {t.consent.details}
        </Link>
      </p>
    </fieldset>
  );
}
