import type { Metadata } from "next";
import { pageMetadata } from "@/lib/page-metadata";

export async function generateMetadata({
  params,
}: LayoutProps<"/[lang]/history">): Promise<Metadata> {
  const { lang } = await params;
  return pageMetadata(lang, { path: "/history", title: (t) => t.meta.history, index: false });
}

export default function HistoryLayout({ children }: LayoutProps<"/[lang]/history">) {
  return children;
}
