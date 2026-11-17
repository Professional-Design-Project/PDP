import type { Locale } from "@/i18n/locale";
import { privacyEn, type PrivacyContent } from "./en";
import { privacyPl } from "./pl";

export const privacy: Record<Locale, PrivacyContent> = { pl: privacyPl, en: privacyEn };
