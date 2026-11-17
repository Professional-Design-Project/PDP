"use client";

import { LocaleLink as Link } from "@/components/locale-link";
import { useLocale } from "@/i18n/locale";

export function FooterSitemap() {
  const { t } = useLocale();
  const links = [
    { href: "/", label: t.status.home },
    { href: "/practice", label: t.header.practice },
    { href: "/history", label: t.history.nav },
    { href: "/account", label: t.auth.account },
    { href: "/how-ai-works", label: t.footer.aiTitle },
    { href: "/privacy", label: t.footer.privacy },
  ];
  return (
    <nav aria-label={t.footer.sitemap}>
      <h2 className="text-[13px] font-semibold text-muted">{t.footer.sitemap}</h2>
      <ul className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-[15px] md:grid-cols-1">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="font-semibold hover:text-cobalt focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cobalt"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
