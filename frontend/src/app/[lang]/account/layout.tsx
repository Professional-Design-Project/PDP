import type { Metadata } from "next";
import { pageMetadata } from "@/lib/page-metadata";

export async function generateMetadata({
  params,
}: LayoutProps<"/[lang]/account">): Promise<Metadata> {
  const { lang } = await params;
  return pageMetadata(lang, { path: "/account", title: (t) => t.meta.account, index: false });
}

export default function AccountLayout({ children }: LayoutProps<"/[lang]/account">) {
  return children;
}
