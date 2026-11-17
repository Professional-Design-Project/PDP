"use client";

import { usePathname, useRouter } from "next/navigation";
import { localeCookie, type Locale } from "@/i18n/config";
import { swapLocale } from "@/i18n/paths";

const year = 60 * 60 * 24 * 365;

export function useSwitchLocale() {
  const router = useRouter();
  const pathname = usePathname();
  return (locale: Locale) => {
    document.cookie = `${localeCookie}=${locale}; path=/; max-age=${year}; samesite=lax`;
    const { search, hash } = window.location;
    router.push(`${swapLocale(pathname, locale)}${search}${hash}`, { scroll: false });
  };
}
