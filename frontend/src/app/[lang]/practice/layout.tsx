import type { Metadata } from "next";
import { pageMetadata } from "@/lib/page-metadata";

export async function generateMetadata({
  params,
}: LayoutProps<"/[lang]/practice">): Promise<Metadata> {
  const { lang } = await params;
  return pageMetadata(lang, { path: "/practice", title: (t) => t.meta.practice, index: false });
}

export default function PracticeLayout({ children }: LayoutProps<"/[lang]/practice">) {
  return children;
}
