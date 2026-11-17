import type { Metadata } from "next";
import { privacy } from "@/i18n/privacy";

export async function generateMetadata({
  params,
}: LayoutProps<"/[lang]/privacy">): Promise<Metadata> {
  const { lang } = await params;
  const content = privacy[lang === "pl" ? "pl" : "en"];
  return { title: `${content.title.replace(/\.$/, "")} · ensaio`, description: content.intro };
}

export default function PrivacyLayout({ children }: LayoutProps<"/[lang]/privacy">) {
  return children;
}
