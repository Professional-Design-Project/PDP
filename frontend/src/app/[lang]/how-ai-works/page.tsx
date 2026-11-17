"use client";

import { DocPage } from "@/components/doc/doc-page";
import { howAiWorks } from "@/i18n/how-ai-works";
import { useLocale } from "@/i18n/locale";

export default function HowAiWorksPage() {
  const { locale } = useLocale();
  return <DocPage content={howAiWorks[locale]} />;
}
