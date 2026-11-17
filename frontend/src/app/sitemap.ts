import type { MetadataRoute } from "next";
import { locales } from "@/i18n/config";
import { localePath } from "@/i18n/paths";
import { publicPages, siteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return publicPages.flatMap((path) =>
    locales.map((locale) => ({
      url: `${siteUrl}${localePath(locale, path)}`,
      changeFrequency: "monthly" as const,
      priority: path === "/" ? 1 : 0.5,
      alternates: {
        languages: Object.fromEntries(
          locales.map((code) => [code, `${siteUrl}${localePath(code, path)}`]),
        ),
      },
    })),
  );
}
