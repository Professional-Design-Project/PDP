"use client";

import { createContext, use, type ReactNode } from "react";
import type { Locale } from "./config";
import { en, type Dictionary } from "./en";
import { pl } from "./pl";

export { defaultLocale, isLocale, locales, type Locale } from "./config";

export const dictionaries: Record<Locale, Dictionary> = { pl, en };

const LocaleContext = createContext<Locale>("en");

export function LocaleProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  return <LocaleContext value={locale}>{children}</LocaleContext>;
}

export function useLocale() {
  const locale = use(LocaleContext);
  return { locale, t: dictionaries[locale] };
}
