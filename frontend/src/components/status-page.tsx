import type { ReactNode } from "react";
import { Rise } from "@/components/rise";

type StatusPageProps = {
  code: string;
  label: string;
  title: string;
  text: string;
  children: ReactNode;
};

export function StatusPage({ code, label, title, text, children }: StatusPageProps) {
  return (
    <main className="mx-auto max-w-7xl px-4 pt-12 pb-24 sm:px-8 sm:pt-16">
      <div className="grid gap-10 border-t-2 border-ink pt-6 lg:grid-cols-12 lg:gap-8">
        <Rise className="lg:col-span-5">
          <p className="text-[120px] leading-none font-bold tracking-[-0.05em] text-cobalt tabular-nums sm:text-[180px]">
            {code}
          </p>
          <p className="mt-2 text-[13px] font-semibold text-muted">{label}</p>
        </Rise>
        <Rise delay={60} className="lg:col-span-7 lg:pt-6">
          <h1 className="text-5xl leading-none font-bold tracking-[-0.04em] text-balance sm:text-7xl">
            {title}
          </h1>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-ink/80">{text}</p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">{children}</div>
        </Rise>
      </div>
    </main>
  );
}
