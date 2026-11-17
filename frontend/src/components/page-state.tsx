"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { Loader } from "@/components/loader";
import { useLocale } from "@/i18n/locale";
import { authEnabled } from "@/lib/supabase/config";

export function RequireAccounts({ children }: { children: ReactNode }) {
  const { t } = useLocale();
  if (authEnabled) return children;
  return (
    <AuthShell title={t.auth.disabledTitle} intro={t.auth.disabledText}>
      <Link
        href="/practice"
        className="font-semibold underline underline-offset-4 hover:text-cobalt"
      >
        {t.auth.goPractise}
      </Link>
    </AuthShell>
  );
}

export function LoadingLine({ label }: { label: string }) {
  return (
    <output className="mt-10 flex animate-fade items-center gap-3 text-[15px] text-muted">
      <Loader className="text-[18px] text-cobalt" />
      {label}
    </output>
  );
}

export function ErrorLine({ message }: { message: string }) {
  return (
    <p role="alert" className="mt-10 inline-flex items-center gap-2 text-[15px]">
      <span aria-hidden="true" className="size-2 bg-persona-rose" />
      {message}
    </p>
  );
}
