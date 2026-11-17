import type { PrivacyTerm } from "@/i18n/privacy/en";

type PrivacyTermsProps = {
  terms: PrivacyTerm[];
  termLabel: string;
  detailLabel: string;
};

export function PrivacyTerms({ terms, termLabel, detailLabel }: PrivacyTermsProps) {
  return (
    <div className="mt-6">
      <div
        aria-hidden="true"
        className="grid grid-cols-12 gap-4 border-b border-line pb-2 text-[13px] font-semibold text-muted max-sm:hidden"
      >
        <span className="col-span-4">{termLabel}</span>
        <span className="col-span-8">{detailLabel}</span>
      </div>
      <dl>
        {terms.map((item) => (
          <div
            key={item.term}
            className="grid gap-1 border-b border-line py-4 sm:grid-cols-12 sm:gap-4"
          >
            <dt className="font-semibold sm:col-span-4">{item.term}</dt>
            <dd className="leading-relaxed text-ink/80 sm:col-span-8">{item.text}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
