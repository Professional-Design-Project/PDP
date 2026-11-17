import { expect, it } from "vitest";
import { pageMetadata } from "./page-metadata";

it("builds localized alternates, the share image and noindex for private pages", () => {
  const meta = pageMetadata("pl", { path: "/history", title: (t) => t.meta.history, index: false });
  expect(meta.title).toBe("Twoje sesje");
  expect(meta.alternates).toEqual({
    canonical: "/pl/history",
    languages: { pl: "/pl/history", en: "/en/history", "x-default": "/en/history" },
  });
  expect(meta.openGraph).toMatchObject({
    locale: "pl_PL",
    images: [{ url: "/pl/opengraph-image/default" }],
  });
  expect(meta.robots).toEqual({ index: false, follow: false });
});

it("falls back to English and keeps public pages indexable", () => {
  const meta = pageMetadata("xx", { path: "/" });
  expect(meta.alternates?.canonical).toBe("/en");
  expect(meta.robots).toBeUndefined();
  expect(meta.description).toMatch(/^Practise job interviews/);
});
