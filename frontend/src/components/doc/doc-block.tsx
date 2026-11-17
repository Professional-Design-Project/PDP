import { LocaleLink as Link } from "@/components/locale-link";
import { ArrowRightIcon } from "@/components/icons";
import { Section } from "@/components/section";
import type { DocSection } from "@/i18n/doc-types";
import { DocTerms } from "./doc-terms";

type DocBlockProps = {
  number: number;
  section: DocSection;
  termLabel: string;
  detailLabel: string;
  whereLabel: string;
};

export function DocBlock({ number, section, termLabel, detailLabel, whereLabel }: DocBlockProps) {
  return (
    <div id={section.id} className="scroll-mt-8">
      <Section number={number} title={section.title}>
        <div className="max-w-2xl space-y-4 text-lg leading-relaxed text-ink/80">
          {section.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
        {section.terms && (
          <DocTerms
            terms={section.terms}
            labels={{ term: termLabel, detail: detailLabel, where: whereLabel }}
          />
        )}
        {section.link && (
          <Link
            href={section.link.href}
            className="group mt-6 inline-flex items-center gap-2 font-semibold underline underline-offset-4 hover:text-cobalt focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cobalt"
          >
            {section.link.label}
            <ArrowRightIcon className="size-4 transition-transform duration-300 ease-(--ease-soft) group-hover:translate-x-0.5" />
          </Link>
        )}
      </Section>
    </div>
  );
}
