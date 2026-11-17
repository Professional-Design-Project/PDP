"use client";

import { LocaleLink as Link } from "@/components/locale-link";
import type { ReactNode } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { useLocale } from "@/i18n/locale";
import type { Dictionary } from "@/i18n/en";
import { authEnabled } from "@/lib/supabase/config";

export type AuthVariant = "login" | "signup" | "forgot" | "reset" | "error";

type AuthPageProps = {
  variant: AuthVariant;
  next?: string;
  children?: ReactNode;
};

function copyFor(variant: AuthVariant, t: Dictionary) {
  const auth = t.auth;
  const copy = {
    login: { title: auth.loginTitle, intro: auth.loginIntro },
    signup: { title: auth.signupTitle, intro: auth.signupIntro },
    forgot: { title: auth.forgotTitle, intro: auth.forgotIntro },
    reset: { title: auth.resetTitle, intro: auth.resetIntro },
    error: { title: auth.errorTitle, intro: auth.errorText },
  };
  return copy[variant];
}

function InlineLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="font-semibold text-ink underline underline-offset-4 hover:text-cobalt"
    >
      {children}
    </Link>
  );
}

function Footer({ variant, next, t }: { variant: AuthVariant; next: string; t: Dictionary }) {
  const query = `?next=${encodeURIComponent(next)}`;
  if (variant === "login") {
    return (
      <>
        {t.auth.noAccount} <InlineLink href={`/signup${query}`}>{t.auth.signUp}</InlineLink>
      </>
    );
  }
  if (variant === "signup") {
    return (
      <>
        {t.auth.haveAccount} <InlineLink href={`/login${query}`}>{t.auth.signIn}</InlineLink>
      </>
    );
  }
  if (variant === "reset") return null;
  return <InlineLink href="/login">{t.auth.backToLogin}</InlineLink>;
}

export function AuthPage({ variant, next = "/practice", children }: AuthPageProps) {
  const { t } = useLocale();
  if (!authEnabled) {
    return (
      <AuthShell title={t.auth.disabledTitle} intro={t.auth.disabledText}>
        <InlineLink href="/practice">{t.auth.goPractise}</InlineLink>
      </AuthShell>
    );
  }
  const { title, intro } = copyFor(variant, t);
  const footer = <Footer variant={variant} next={next} t={t} />;
  return (
    <AuthShell title={title} intro={intro} footer={variant === "error" ? undefined : footer}>
      {children ?? footer}
    </AuthShell>
  );
}
