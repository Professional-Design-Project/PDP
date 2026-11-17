import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { isLocale, locales } from "@/i18n/config";
import { en } from "@/i18n/en";
import { LocaleProvider } from "@/i18n/locale";
import { pl } from "@/i18n/pl";
import { schibstedGrotesk } from "@/lib/font";
import "../globals.css";

export const dynamicParams = false;

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  const t = lang === "pl" ? pl : en;
  return { title: "ensaio", description: t.footer.tagline };
}

export default async function RootLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return (
    <html lang={lang} className={schibstedGrotesk.variable}>
      <body className="flex min-h-screen flex-col">
        <LocaleProvider locale={lang}>
          <SiteHeader />
          <div className="flex-1">{children}</div>
          <SiteFooter />
        </LocaleProvider>
      </body>
    </html>
  );
}
