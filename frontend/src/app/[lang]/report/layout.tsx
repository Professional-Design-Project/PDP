import type { Metadata } from "next";
import { pageMetadata } from "@/lib/page-metadata";

export async function generateMetadata({
  params,
}: LayoutProps<"/[lang]/report">): Promise<Metadata> {
  const { lang } = await params;
  return pageMetadata(lang, { path: "/report", title: (t) => t.meta.report, index: false });
}

export default function ReportLayout({ children }: LayoutProps<"/[lang]/report">) {
  return children;
}
