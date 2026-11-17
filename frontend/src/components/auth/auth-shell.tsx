import type { ReactNode } from "react";
import { Rise } from "@/components/rise";

type AuthShellProps = {
  title: string;
  intro: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthShell({ title, intro, children, footer }: AuthShellProps) {
  return (
    <main className="mx-auto grid max-w-7xl gap-12 px-4 pt-14 pb-24 sm:px-8 sm:pt-20 lg:grid-cols-12 lg:gap-8">
      <div className="lg:col-span-6">
        <Rise
          as="h1"
          className="text-5xl leading-[0.95] font-bold tracking-[-0.04em] text-balance sm:text-7xl"
        >
          {title}
        </Rise>
        <Rise as="p" delay={50} className="mt-6 max-w-md text-lg leading-relaxed text-ink/80">
          {intro}
        </Rise>
      </div>
      <Rise delay={100} className="lg:col-span-5 lg:col-start-8">
        <div className="border border-ink bg-white p-6 sm:p-8">{children}</div>
        {footer && <div className="mt-5 text-[15px] text-muted">{footer}</div>}
      </Rise>
    </main>
  );
}
