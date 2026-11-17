"use client";

import { PrivacyBlock } from "@/components/privacy/privacy-block";
import { PrivacyContents } from "@/components/privacy/privacy-contents";
import { Rise } from "@/components/rise";
import { useLocale } from "@/i18n/locale";
import { privacy } from "@/i18n/privacy";

export default function PrivacyPage() {
  const { locale } = useLocale();
  const content = privacy[locale];
  return (
    <main className="mx-auto max-w-7xl px-4 pt-12 pb-24 sm:px-8 sm:pt-16">
      <div className="grid gap-6 lg:grid-cols-12 lg:items-end lg:gap-8">
        <Rise
          as="h1"
          className="text-5xl leading-none font-bold tracking-[-0.04em] sm:text-7xl lg:col-span-7"
        >
          {content.title}
        </Rise>
        <Rise as="div" delay={50} className="max-w-md lg:col-span-5">
          <p className="text-lg text-ink/80">{content.intro}</p>
          <p className="mt-4 text-[13px] text-muted">{content.updated}</p>
        </Rise>
      </div>

      <Rise delay={80} className="mt-10 flex gap-3 bg-raised p-5 text-[15px] leading-relaxed">
        <span aria-hidden="true" className="mt-1.5 size-2.5 shrink-0 bg-cobalt" />
        <p>{content.status}</p>
      </Rise>

      <div className="mt-14 grid gap-14 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-4">
          <PrivacyContents label={content.contents} sections={content.sections} />
        </div>
        <div className="space-y-16 lg:col-span-8">
          {content.sections.map((section, index) => (
            <PrivacyBlock
              key={section.id}
              number={index + 1}
              section={section}
              termLabel={content.termLabel}
              detailLabel={content.detailLabel}
              whereLabel={content.whereLabel}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
