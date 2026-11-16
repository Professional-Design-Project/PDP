import type { ReactNode } from "react";

type SectionProps = {
  number: number;
  title: string;
  description?: string;
  children: ReactNode;
};

export function Section({ number, title, description, children }: SectionProps) {
  const headingId = `section-${number}`;
  return (
    <section aria-labelledby={headingId} className="border-t-2 border-ink pt-5">
      <h2 id={headingId} className="text-[32px] leading-tight font-bold tracking-tight">
        <span className="mr-3 text-muted">{number}</span>
        {title}
      </h2>
      {description && <p className="mt-3 max-w-xl text-muted">{description}</p>}
      <div className="mt-6">{children}</div>
    </section>
  );
}
