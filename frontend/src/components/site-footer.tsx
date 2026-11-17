"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon } from "@/components/icons";
import { useLocale } from "@/i18n/locale";

export function SiteFooter() {
  const { t } = useLocale();
  return (
    <footer className="border-t border-ink">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-8 md:grid-cols-12 md:gap-8">
        <div className="md:col-span-5">
          <Image src="/brand/logo.svg" alt="ensaio" width={113} height={40} />
          <p className="mt-4 max-w-xs text-lg leading-snug text-muted">{t.footer.tagline}</p>
        </div>

        <div className="md:col-span-4">
          <h2 className="text-[13px] font-semibold text-muted">{t.footer.aiTitle}</h2>
          <p className="mt-3 text-[15px] leading-relaxed">{t.footer.aiText}</p>
        </div>

        <div className="md:col-span-3">
          <h2 className="text-[13px] font-semibold text-muted">{t.footer.dataTitle}</h2>
          <p className="mt-3 text-[15px] leading-relaxed">{t.footer.dataText}</p>
          <Link
            href="/privacy"
            className="group mt-4 inline-flex items-center gap-2 text-[15px] font-semibold hover:text-cobalt focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cobalt"
          >
            {t.footer.dataMore}
            <ArrowRightIcon className="size-4 transition-transform duration-300 ease-(--ease-soft) group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 text-[13px] text-muted sm:px-8">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <p>© 2026 ensaio</p>
            <Link
              href="/privacy"
              className="font-semibold text-ink underline underline-offset-4 hover:text-cobalt focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cobalt"
            >
              {t.footer.privacy}
            </Link>
          </div>
          <a
            href="#top"
            className="group inline-flex items-center gap-2 font-semibold text-ink hover:text-cobalt focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cobalt"
          >
            {t.footer.top}
            <ArrowRightIcon className="size-4 -rotate-90 transition-transform duration-300 ease-(--ease-soft) group-hover:-translate-y-0.5" />
          </a>
        </div>
      </div>
    </footer>
  );
}
