"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [{ href: "/practice", label: "Practice" }];

export function SiteHeader() {
  const pathname = usePathname();
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
          <ul className="flex gap-8">
            {links.map((link) => {
              const current = pathname === link.href;
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={current ? "page" : undefined}
                    className={`bg-[linear-gradient(currentColor,currentColor)] bg-bottom-left bg-no-repeat pb-1 text-[15px] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cobalt ${
                      current
                        ? "bg-[length:100%_2px] font-semibold"
                        : "bg-[length:0%_2px] text-ink/80 hover:bg-[length:100%_2px] hover:text-ink"
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </header>
  );
}
