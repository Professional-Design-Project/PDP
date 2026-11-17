"use client";

import { DocPage } from "@/components/doc/doc-page";
import { useLocale } from "@/i18n/locale";
import { privacy } from "@/i18n/privacy";

export default function PrivacyPage() {
  const { locale } = useLocale();
  return <DocPage content={privacy[locale]} />;
}
