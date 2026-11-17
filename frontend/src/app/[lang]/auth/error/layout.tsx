import type { Metadata } from "next";
import { pageMetadata } from "@/lib/page-metadata";

export async function generateMetadata({
  params,
}: LayoutProps<"/[lang]/auth/error">): Promise<Metadata> {
  const { lang } = await params;
  return pageMetadata(lang, { path: "/auth/error", title: (t) => t.meta.authError, index: false });
}

export default function AuthErrorLayout({ children }: LayoutProps<"/[lang]/auth/error">) {
  return children;
}
