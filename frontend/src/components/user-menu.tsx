"use client";

import { LocaleLink as Link } from "@/components/locale-link";
import { StableLabel } from "@/components/stable-label";
import { useAuth } from "@/hooks/use-auth";
import { useLocale } from "@/i18n/locale";

const link =
  "inline-flex h-10 items-center px-3 text-[15px] font-semibold hover:text-cobalt focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt";

export function UserMenu() {
  const { t } = useLocale();
  const { enabled, user, loading, signOut } = useAuth();
  if (!enabled || loading) return null;
  if (!user) {
    return (
      <Link href="/login" className={link}>
        <StableLabel pick={(d) => d.auth.signIn} />
      </Link>
    );
  }
  return (
    <div className="flex items-center gap-1">
      <Link href="/history" className={link}>
        <StableLabel pick={(d) => d.history.nav} />
      </Link>
      <Link href="/account" className={`${link} max-w-48 max-md:hidden`} title={user.email}>
        <span className="truncate">{user.email ?? t.auth.account}</span>
      </Link>
      <button type="button" onClick={() => void signOut()} className={link}>
        <StableLabel pick={(d) => d.auth.signOut} />
      </button>
    </div>
  );
}
