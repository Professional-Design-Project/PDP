import type { Metadata } from "next";
import { isLocale, locales, type Locale } from "@/i18n/config";
import { en, type Dictionary } from "@/i18n/en";
import { localePath } from "@/i18n/paths";
import { pl } from "@/i18n/pl";

type PageMetadataOptions = {
  path: string;
  title?: (t: Dictionary) => string;
  description?: (t: Dictionary) => string;
  index?: boolean;
};

export function dictionaryFor(lang: string): { locale: Locale; t: Dictionary } {
  const locale = isLocale(lang) ? lang : "en";
  return { locale, t: locale === "pl" ? pl : en };
}

export function pageMetadata(lang: string, options: PageMetadataOptions): Metadata {
  const { locale, t } = dictionaryFor(lang);
  const title = options.title?.(t);
  const description = options.description?.(t) ?? t.meta.description;
  const url = localePath(locale, options.path);
  return {
    ...(title ? { title } : {}),
    description,
    alternates: {
      canonical: url,
      languages: {
        ...Object.fromEntries(locales.map((code) => [code, localePath(code, options.path)])),
        "x-default": localePath("en", options.path),
      },
    },
    openGraph: {
      type: "website",
      siteName: "ensaio",
      locale: locale === "pl" ? "pl_PL" : "en_GB",
      url,
      ...(title ? { title } : {}),
      description,
      images: [
        {
          url: localePath(locale, "/opengraph-image/default"),
          width: 1200,
          height: 630,
          alt: t.meta.imageAlt,
        },
      ],
    },
    robots: options.index === false ? { index: false, follow: false } : undefined,
  };
}
