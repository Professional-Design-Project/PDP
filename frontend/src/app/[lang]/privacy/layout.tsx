import type { Metadata } from "next";
import { privacy } from "@/i18n/privacy";
import { dictionaryFor, pageMetadata } from "@/lib/page-metadata";

export async function generateMetadata({
  params,
}: LayoutProps<"/[lang]/privacy">): Promise<Metadata> {
  const { lang } = await params;
  const content = privacy[dictionaryFor(lang).locale];
  return pageMetadata(lang, {
    path: "/privacy",
    title: () => content.title.replace(/\.$/, ""),
    description: () => content.intro,
  });
}

export default function PrivacyLayout({ children }: LayoutProps<"/[lang]/privacy">) {
  return children;
}
