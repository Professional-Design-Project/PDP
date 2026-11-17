import type { Metadata } from "next";
import { pageMetadata } from "@/lib/page-metadata";

export async function generateMetadata({
  params,
}: LayoutProps<"/[lang]/forgot-password">): Promise<Metadata> {
  const { lang } = await params;
  return pageMetadata(lang, {
    path: "/forgot-password",
    title: (t) => t.meta.forgot,
    index: false,
  });
}

export default function ForgotPasswordLayout({ children }: LayoutProps<"/[lang]/forgot-password">) {
  return children;
}
