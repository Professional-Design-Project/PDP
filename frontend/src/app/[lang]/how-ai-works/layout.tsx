import type { Metadata } from "next";
import { howAiWorks } from "@/i18n/how-ai-works";
import { dictionaryFor, pageMetadata } from "@/lib/page-metadata";

export async function generateMetadata({
  params,
}: LayoutProps<"/[lang]/how-ai-works">): Promise<Metadata> {
  const { lang } = await params;
  const content = howAiWorks[dictionaryFor(lang).locale];
  return pageMetadata(lang, {
    path: "/how-ai-works",
    title: () => content.title.replace(/\.$/, ""),
    description: () => content.intro,
  });
}

export default function HowAiWorksLayout({ children }: LayoutProps<"/[lang]/how-ai-works">) {
  return children;
}
