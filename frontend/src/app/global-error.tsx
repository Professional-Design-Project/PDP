"use client";

import { buttonStyles } from "@/components/button-styles";
import { en } from "@/i18n/en";
import { pl } from "@/i18n/pl";
import { schibstedGrotesk } from "@/lib/font";
import "./globals.css";

export default function GlobalError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <html lang="pl" className={schibstedGrotesk.variable}>
      <body className="min-h-screen">
        <title>ensaio</title>
        <main className="mx-auto max-w-3xl px-4 py-24 sm:px-8">
          <p className="text-[120px] leading-none font-bold tracking-[-0.05em] text-cobalt tabular-nums">
            500
          </p>
          {[pl, en].map((t) => (
            <section
              key={t.locale.short}
              lang={t.locale.short.toLowerCase()}
              className="mt-10 border-t-2 border-ink pt-5"
            >
              <h1 className="text-4xl leading-none font-bold tracking-[-0.03em]">
                {t.status.errorTitle}
              </h1>
              <p className="mt-4 max-w-md text-lg leading-relaxed text-ink/80">
                {t.status.errorText}
              </p>
            </section>
          ))}
          <button type="button" onClick={() => retry()} className={`${buttonStyles.ink} mt-10`}>
            {pl.status.retry} / {en.status.retry}
          </button>
        </main>
      </body>
    </html>
  );
}
