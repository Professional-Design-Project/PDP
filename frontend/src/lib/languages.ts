import type { Locale } from "@/i18n/locale";

export const conversationLanguages: { value: Locale; label: string }[] = [
  { value: "pl", label: "Polski" },
  { value: "en", label: "English" },
];

export function languageName(value: Locale) {
  return conversationLanguages.find((option) => option.value === value)?.label ?? value;
}
