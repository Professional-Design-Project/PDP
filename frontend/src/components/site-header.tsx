"use client";

import Image from "next/image";
import { LocaleLink as Link } from "@/components/locale-link";
import { usePathname } from "next/navigation";
import { ArrowRightIcon } from "@/components/icons";
import { LocaleSwitch } from "@/components/locale-switch";
import { MobileMenu } from "@/components/mobile-menu";
import { StableLabel } from "@/components/stable-label";
import { UserMenu } from "@/components/user-menu";
import { useLocale } from "@/i18n/locale";
import { splitLocale } from "@/i18n/paths";

export function SiteHeader() {
  const onPractice = splitLocale(usePathname()).rest === "/practice";
  const { t } = useLocale();
  return (
    <header id="top" className="relative border-b border-ink">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-8">
        <Link
          href="/"
          aria-label={t.header.home}
          className="focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cobalt"
        >
          <Image src="/brand/logo.svg" alt="ensaio" width={88} height={31} loading="eager" />
        </Link>
        <div className="flex items-center gap-3">
          <LocaleSwitch />
          <MobileMenu showPractice={!onPractice} />
          <div className="flex items-center gap-3 max-sm:hidden">
            <UserMenu />
            {!onPractice && (
              <nav aria-label="Main">
                <Link
                  href="/practice"
                  data-pressable
                  className="group inline-flex h-10 items-center gap-3 bg-ink px-4 text-[15px] font-semibold text-white hover:bg-cobalt focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt"
                >
                  <StableLabel pick={(d) => d.header.practice} />
                  <ArrowRightIcon className="size-4 transition-transform duration-300 ease-(--ease-soft) group-hover:translate-x-0.5" />
                </Link>
              </nav>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
