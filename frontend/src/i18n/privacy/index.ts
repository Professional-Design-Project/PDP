import type { Locale } from "@/i18n/locale";
import type { DocContent } from "@/i18n/doc-types";
import { privacyEn } from "./en";
import { privacyPl } from "./pl";

export const privacy: Record<Locale, DocContent> = { pl: privacyPl, en: privacyEn };
