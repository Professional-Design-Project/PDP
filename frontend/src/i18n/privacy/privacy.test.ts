import { expect, it } from "vitest";
import { privacyEn } from "./en";
import { privacyPl } from "./pl";

it("has the same sections in the same order in every language", () => {
  const shape = (content: typeof privacyEn) =>
    content.sections.map((section) => ({
      id: section.id,
      paragraphs: section.paragraphs.length,
      terms: section.terms?.length ?? 0,
      link: section.link?.href ?? null,
    }));
  expect(shape(privacyPl)).toEqual(shape(privacyEn));
});
