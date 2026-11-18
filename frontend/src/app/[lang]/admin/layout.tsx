import type { Metadata } from "next";
import { pageMetadata } from "@/lib/page-metadata";

export async function generateMetadata({
  params,
}: LayoutProps<"/[lang]/admin">): Promise<Metadata> {
  const { lang } = await params;
  return pageMetadata(lang, { path: "/admin", title: (t) => t.meta.admin, index: false });
}

export default function AdminLayout({ children }: LayoutProps<"/[lang]/admin">) {
  return children;
}
