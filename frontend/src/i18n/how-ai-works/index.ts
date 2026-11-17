import type { DocContent } from "@/i18n/doc-types";
import type { Locale } from "@/i18n/locale";
import { howAiWorksEn } from "./en";
import { howAiWorksPl } from "./pl";

export const howAiWorks: Record<Locale, DocContent> = { pl: howAiWorksPl, en: howAiWorksEn };
