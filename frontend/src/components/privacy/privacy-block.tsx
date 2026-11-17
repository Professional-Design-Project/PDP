import Link from "next/link";
import { ArrowRightIcon } from "@/components/icons";
import { Section } from "@/components/section";
import type { PrivacySection } from "@/i18n/privacy/en";
import { PrivacyTerms } from "./privacy-terms";

type PrivacyBlockProps = {
  number: number;
  section: PrivacySection;
  termLabel: string;
  detailLabel: string;
};

export function PrivacyBlock({ number, section, termLabel, detailLabel }: PrivacyBlockProps) {
  return (
    <div id={section.id} className="scroll-mt-8">
      <Section number={number} title={section.title}>
        <div className="max-w-2xl space-y-4 text-lg leading-relaxed text-ink/80">
          {section.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
        {section.terms && (
          <PrivacyTerms terms={section.terms} termLabel={termLabel} detailLabel={detailLabel} />
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
