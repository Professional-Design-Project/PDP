import type { PrivacySection } from "@/i18n/privacy/en";

type PrivacyContentsProps = {
  label: string;
  sections: PrivacySection[];
};

export function PrivacyContents({ label, sections }: PrivacyContentsProps) {
  return (
    <nav aria-label={label} className="border-t-2 border-ink pt-5 lg:sticky lg:top-8">
      <p className="text-[13px] font-semibold text-muted">{label}</p>
      <ol className="mt-3">
        {sections.map((section, index) => (
          <li key={section.id} className="border-b border-line">
            <a
              href={`#${section.id}`}
              className="flex gap-3 py-2.5 text-[15px] hover:text-cobalt focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt"
            >
              <span className="w-5 text-muted tabular-nums">{index + 1}</span>
              {section.title}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
