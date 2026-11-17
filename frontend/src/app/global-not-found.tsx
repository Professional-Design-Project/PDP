import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { NotFoundContent } from "@/components/not-found-content";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { isLocale, localeCookie, localeHeader } from "@/i18n/config";
import { LocaleProvider } from "@/i18n/locale";
import { preferredLocale } from "@/i18n/negotiate";
import { schibstedGrotesk } from "@/lib/font";
import "./globals.css";

export const metadata: Metadata = { title: "404 · ensaio" };

async function requestLocale() {
  const [headerList, cookieStore] = await Promise.all([headers(), cookies()]);
  const fromPath = headerList.get(localeHeader);
  if (isLocale(fromPath)) return fromPath;
  return preferredLocale(cookieStore.get(localeCookie)?.value, headerList.get("accept-language"));
}

export default async function GlobalNotFound() {
  const locale = await requestLocale();
  return (
    <html lang={locale} className={schibstedGrotesk.variable}>
      <body className="flex min-h-screen flex-col">
        <LocaleProvider locale={locale}>
          <SiteHeader />
          <div className="flex-1">
            <NotFoundContent />
          </div>
          <SiteFooter />
        </LocaleProvider>
      </body>
    </html>
  );
}
