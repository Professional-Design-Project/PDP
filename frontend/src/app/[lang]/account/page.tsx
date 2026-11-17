"use client";

import { LocaleLink as Link } from "@/components/locale-link";
import { ConsentCard } from "@/components/account/consent-card";
import { DangerZone } from "@/components/account/danger-zone";
import { DataExport } from "@/components/account/data-export";
import { GitHubIcon } from "@/components/icons";
import { ErrorLine, LoadingLine, RequireAccounts } from "@/components/page-state";
import { Rise } from "@/components/rise";
import { useAuth } from "@/hooks/use-auth";
import { useSupabaseQuery } from "@/hooks/use-supabase-query";
import { useLocale } from "@/i18n/locale";
import { latestConsent } from "@/lib/account";
import { signInMethods } from "@/lib/auth-providers";

function AccountView() {
  const { t } = useLocale();
  const { user } = useAuth();
  const { state, reload } = useSupabaseQuery(latestConsent, "consent");
  const methods = signInMethods(user);

  return (
    <main className="mx-auto max-w-7xl px-4 pt-12 pb-24 sm:px-8 sm:pt-16">
      <div className="grid gap-6 lg:grid-cols-12 lg:items-end lg:gap-8">
        <Rise
          as="h1"
          className="text-5xl leading-none font-bold tracking-[-0.04em] sm:text-7xl lg:col-span-7"
        >
          {t.account.title}
        </Rise>
        <Rise as="p" delay={50} className="max-w-md text-lg text-ink/80 lg:col-span-5">
          {t.account.intro}
        </Rise>
      </div>

      <Rise delay={100} className="mt-14 grid gap-14 lg:grid-cols-12 lg:gap-8">
        <div className="space-y-14 lg:col-span-8">
          {state.status === "loading" && <LoadingLine label={t.loading.text} />}
          {state.status === "error" && <ErrorLine message={t.account.failed} />}
          {state.status === "ready" && <ConsentCard consent={state.data} onChanged={reload} />}
          <DataExport />
          <DangerZone />
        </div>
        <aside className="h-fit bg-ink p-6 text-white lg:col-span-4">
          <p className="text-[14px] text-ink-muted">{t.account.signedInAs}</p>
          <p className="mt-1 truncate text-lg font-semibold">{user?.email ?? "…"}</p>
          {methods.github && (
            <p className="mt-3 inline-flex items-center gap-2 text-[14px] text-ink-muted">
              <GitHubIcon className="size-4 shrink-0" />
              {t.account.viaGithub}
            </p>
          )}
          {methods.password && (
            <Link
              href="/account/password"
              className="mt-5 block w-fit font-semibold underline underline-offset-4 hover:text-persona-slate"
            >
              {t.account.changePassword}
            </Link>
          )}
        </aside>
      </Rise>
    </main>
  );
}

export default function AccountPage() {
  return (
    <RequireAccounts>
      <AccountView />
    </RequireAccounts>
  );
}
