import { isLocale, type Locale } from "./config";

export function splitLocale(pathname: string): { locale: Locale | null; rest: string } {
  const [, first, ...others] = pathname.split("/");
  if (!isLocale(first)) return { locale: null, rest: pathname };
  return { locale: first, rest: `/${others.join("/")}` };
}

export function localePath(locale: Locale, path: string) {
  if (!path.startsWith("/") || path.startsWith("//")) return path;
  if (splitLocale(path).locale) return path;
  return path === "/" ? `/${locale}` : `/${locale}${path}`;
}

export function swapLocale(pathname: string, locale: Locale) {
  return localePath(locale, splitLocale(pathname).rest);
}
