import type { MetadataRoute } from "next";
import { locales } from "@/i18n/config";
import { localePath } from "@/i18n/paths";
import { privatePages, siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: locales.flatMap((locale) => privatePages.map((path) => localePath(locale, path))),
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
