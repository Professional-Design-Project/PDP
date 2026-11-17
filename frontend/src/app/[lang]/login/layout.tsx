import type { Metadata } from "next";
import { pageMetadata } from "@/lib/page-metadata";

export async function generateMetadata({
  params,
}: LayoutProps<"/[lang]/login">): Promise<Metadata> {
  const { lang } = await params;
  return pageMetadata(lang, { path: "/login", title: (t) => t.meta.login, index: false });
}

export default function LoginLayout({ children }: LayoutProps<"/[lang]/login">) {
  return children;
}
