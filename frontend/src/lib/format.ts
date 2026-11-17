import type { Locale } from "@/i18n/locale";

export function formatDate(value: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "pl" ? "pl-PL" : "en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
