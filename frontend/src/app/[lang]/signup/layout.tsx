import type { Metadata } from "next";
import { pageMetadata } from "@/lib/page-metadata";

export async function generateMetadata({
  params,
}: LayoutProps<"/[lang]/signup">): Promise<Metadata> {
  const { lang } = await params;
  return pageMetadata(lang, { path: "/signup", title: (t) => t.meta.signup, index: false });
}

export default function SignupLayout({ children }: LayoutProps<"/[lang]/signup">) {
  return children;
}
