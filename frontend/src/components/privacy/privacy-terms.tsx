import type { PrivacyTerm } from "@/i18n/privacy/en";

type PrivacyTermsProps = {
  terms: PrivacyTerm[];
  labels: { term: string; detail: string; where: string };
};

export function PrivacyTerms({ terms, labels }: PrivacyTermsProps) {
  const located = terms.some((item) => item.where);
  const detailSpan = located ? "sm:col-span-5" : "sm:col-span-8";
  return (
    <div className="mt-6">
      <div
        aria-hidden="true"
        className="grid grid-cols-12 gap-4 border-b border-line pb-2 text-[13px] font-semibold text-muted max-sm:hidden"
      >
        <span className="col-span-4">{labels.term}</span>
        <span className={located ? "col-span-5" : "col-span-8"}>{labels.detail}</span>
        {located && <span className="col-span-3">{labels.where}</span>}
      </div>
      <dl>
        {terms.map((item) => (
          <div
            key={item.term}
            className="grid gap-1 border-b border-line py-4 sm:grid-cols-12 sm:gap-4"
          >
            <dt className="font-semibold sm:col-span-4">{item.term}</dt>
            <dd className={`leading-relaxed text-ink/80 ${detailSpan}`}>{item.text}</dd>
            {item.where && (
              <dd className="text-[15px] leading-relaxed text-muted sm:col-span-3">
                <span className="font-semibold sm:sr-only">{labels.where}: </span>
                {item.where}
              </dd>
            )}
          </div>
        ))}
      </dl>
    </div>
  );
}
