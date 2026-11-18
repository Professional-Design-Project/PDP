"use client";

import { ReportBoard } from "@/components/admin/report-board";
import { ErrorLine, LoadingLine, RequireAccounts } from "@/components/page-state";
import { Rise } from "@/components/rise";
import { useAdminReports } from "@/hooks/use-admin-reports";
import { useLocale } from "@/i18n/locale";

function AdminView() {
  const { t } = useLocale();
  const { state, reports, failed, changeStatus, remove } = useAdminReports();
  return (
    <main className="mx-auto max-w-7xl px-4 pt-12 pb-24 sm:px-8 sm:pt-16">
      <div className="grid gap-6 lg:grid-cols-12 lg:items-end lg:gap-8">
        <Rise
          as="h1"
          className="text-5xl leading-none font-bold tracking-[-0.04em] sm:text-7xl lg:col-span-7"
        >
          {t.admin.title}
        </Rise>
        <Rise as="p" delay={50} className="max-w-md text-lg text-ink/80 lg:col-span-5">
          {t.admin.intro}
        </Rise>
      </div>
      {state.status === "loading" && <LoadingLine label={t.admin.loading} />}
      {state.status === "error" && <ErrorLine message={t.admin.failed} />}
      {state.status === "ready" && !reports && <ErrorLine message={t.admin.denied} />}
      {failed && <ErrorLine message={t.admin.actionFailed} />}
      {reports && (
        <ReportBoard
          reports={reports}
          onStatus={(id, status) => void changeStatus(id, status)}
          onDelete={(id) => void remove(id)}
        />
      )}
    </main>
  );
}

export default function AdminPage() {
  return (
    <RequireAccounts>
      <AdminView />
    </RequireAccounts>
  );
}
