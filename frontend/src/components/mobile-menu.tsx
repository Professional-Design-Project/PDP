"use client";

import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { LocaleLink as Link } from "@/components/locale-link";
import { ArrowRightIcon, CloseIcon, MenuIcon } from "@/components/icons";
import { useAuth } from "@/hooks/use-auth";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { useLocale } from "@/i18n/locale";

const row =
  "flex h-14 w-full items-center justify-between border-t border-line px-4 text-lg font-semibold hover:text-cobalt focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-cobalt";

export function MobileMenu({ showPractice }: { showPractice: boolean }) {
  const { t } = useLocale();
  const { enabled, user, signOut } = useAuth();
  const admin = useIsAdmin(user?.id);
  const pathname = usePathname();
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const [openedAt, setOpenedAt] = useState(pathname);

  if (open && openedAt !== pathname) {
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [open]);

  function toggle() {
    setOpenedAt(pathname);
    setOpen((value) => !value);
  }

  return (
    <div className="sm:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={toggle}
        className="grid size-10 place-items-center border border-ink hover:bg-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt"
      >
        <span className="sr-only">{t.header.menu}</span>
        {open ? <CloseIcon className="size-5" /> : <MenuIcon className="size-5" />}
      </button>
      {open && (
        <nav
          id={panelId}
          aria-label={t.header.menu}
          className="absolute inset-x-0 top-16 z-40 animate-fade border-b border-ink bg-canvas"
        >
          {showPractice && (
            <Link
              href="/practice"
              className={`${row} border-t-0 bg-ink text-white hover:text-white`}
            >
              {t.header.practice}
              <ArrowRightIcon className="size-5" />
            </Link>
          )}
          {enabled && user && (
            <>
              <Link href="/history" className={row}>
                {t.history.nav}
              </Link>
              <Link href="/report" className={row}>
                {t.report.nav}
              </Link>
              {admin && (
                <Link href="/admin" className={row}>
                  {t.admin.nav}
                </Link>
              )}
              <Link href="/account" className={row}>
                <span>{t.auth.account}</span>
                <span className="ml-4 truncate text-[14px] font-normal text-muted">
                  {user.email}
                </span>
              </Link>
              <button type="button" onClick={() => void signOut()} className={row}>
                {t.auth.signOut}
              </button>
            </>
          )}
          {enabled && !user && (
            <Link href="/login" className={row}>
              {t.auth.signIn}
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
