"use client";

import { useEffect, useSyncExternalStore } from "react";
import { flushSync } from "react-dom";
import { en, type Dictionary } from "./en";
import { pl } from "./pl";

export type Locale = "pl" | "en";

export const locales: Locale[] = ["pl", "en"];

const dictionaries: Record<Locale, Dictionary> = { pl, en };
const STORAGE_KEY = "ensaio.locale";
const listeners = new Set<() => void>();
let memory: Locale | null = null;

function detect(): Locale {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "pl" || stored === "en") return stored;
  } catch {
    return "en";
  }
  return navigator.language?.toLowerCase().startsWith("pl") ? "pl" : "en";
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): Locale {
  memory ??= detect();
  return memory;
}

function getServerSnapshot(): Locale {
  return "en";
}

function apply(locale: Locale) {
  memory = locale;
  try {
    window.localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    memory = locale;
  }
  flushSync(() => listeners.forEach((listener) => listener()));
}

export function setLocale(locale: Locale) {
  if (locale === memory) return;
  const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  if (typeof document.startViewTransition !== "function" || reduced) {
    apply(locale);
    return;
  }
  document.startViewTransition(() => apply(locale));
}

export function resetLocaleMemory() {
  memory = null;
}

export function useLocale() {
  const locale = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return { locale, t: dictionaries[locale] };
}

export function LocaleSync() {
  const { locale } = useLocale();
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  return null;
}
