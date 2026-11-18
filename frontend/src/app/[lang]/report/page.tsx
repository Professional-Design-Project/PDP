"use client";

import { RequireAccounts } from "@/components/page-state";
import { ReportForm } from "@/components/reports/report-form";
import { Rise } from "@/components/rise";
import { useLocale } from "@/i18n/locale";

function ReportView() {
  const { t } = useLocale();
  return (
    <main className="mx-auto max-w-7xl px-4 pt-12 pb-24 sm:px-8 sm:pt-16">
      <div className="grid gap-6 lg:grid-cols-12 lg:items-end lg:gap-8">
        <Rise
          as="h1"
          className="text-5xl leading-none font-bold tracking-[-0.04em] sm:text-7xl lg:col-span-7"
        >
          {t.report.title}
        </Rise>
        <Rise as="p" delay={50} className="max-w-md text-lg text-ink/80 lg:col-span-5">
          {t.report.intro}
        </Rise>
      </div>
      <Rise delay={100} className="mt-14 max-w-3xl">
        <ReportForm />
      </Rise>
    </main>
  );
}

export default function ReportPage() {
  return (
    <RequireAccounts>
      <ReportView />
    </RequireAccounts>
  );
}
