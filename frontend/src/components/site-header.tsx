"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRightIcon } from "@/components/icons";

export function SiteHeader() {
  const onPractice = usePathname() === "/practice";
  return (
    <header className="border-b border-ink">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-8">
        <Link
          href="/"
          aria-label="ensaio home"
          className="focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cobalt"
        >
          <Image src="/brand/logo.svg" alt="ensaio" width={88} height={31} loading="eager" />
        </Link>
        <nav aria-label="Main">
          <Link
            href="/practice"
            data-pressable
            aria-current={onPractice ? "page" : undefined}
            className={`group inline-flex h-10 items-center gap-3 px-4 text-[15px] font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt ${
              onPractice ? "border border-ink text-ink" : "bg-ink text-white hover:bg-cobalt"
            }`}
          >
            Practice
            {!onPractice && (
              <ArrowRightIcon className="size-4 transition-transform duration-300 ease-(--ease-soft) group-hover:translate-x-0.5" />
            )}
          </Link>
        </nav>
      </div>
    </header>
  );
}
