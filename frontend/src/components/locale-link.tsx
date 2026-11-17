"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { useLocale } from "@/i18n/locale";
import { localePath } from "@/i18n/paths";

type LocaleLinkProps = Omit<ComponentProps<typeof Link>, "href"> & { href: string };

export function LocaleLink({ href, ...props }: LocaleLinkProps) {
  const { locale } = useLocale();
  return <Link href={localePath(locale, href)} {...props} />;
}
