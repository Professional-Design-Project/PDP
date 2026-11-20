"use client";

import { CheckboxBox } from "@/components/checkbox-box";
import { LocaleLink as Link } from "@/components/locale-link";
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
                <CheckboxBox
                  checked={choices[key]}
                  onChange={(checked) => onChange(key, checked)}
                />
                <span>
                  {t.consent.labels[key]}{" "}
                  <span className="text-muted">
                    {required ? t.consent.required : t.consent.optional}
                  </span>
                  {key === "outside_eu" && (
                    <>
                      {" "}
                      <Link
                        href="/privacy#providers"
                        className="font-semibold text-ink underline underline-offset-2 hover:text-cobalt focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt"
                      >
                        {t.consent.providers}
                      </Link>
                    </>
                  )}
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
