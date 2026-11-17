export type Locale = "pl" | "en";

export const locales: Locale[] = ["pl", "en"];
export const defaultLocale: Locale = "en";
export const localeCookie = "ensaio.locale";
export const localeHeader = "x-ensaio-locale";

export function isLocale(value: unknown): value is Locale {
  return value === "pl" || value === "en";
}
