import { expect, it } from "vitest";
import type { DocContent } from "./doc-types";
import { howAiWorks } from "./how-ai-works";
import { privacy } from "./privacy";

const shape = (content: DocContent) =>
  content.sections.map((section) => ({
    id: section.id,
    paragraphs: section.paragraphs.length,
    terms: section.terms?.length ?? 0,
    link: section.link?.href ?? null,
  }));

it.each([
  ["privacy", privacy],
  ["how the AI works", howAiWorks],
])("has the same %s sections in the same order in every language", (_name, content) => {
  expect(shape(content.pl)).toEqual(shape(content.en));
});
