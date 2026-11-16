"use client";

import Link from "next/link";
import { arrowMotion, buttonStyles } from "@/components/button-styles";
import { ContextDemo } from "@/components/context-demo";
import { ArrowRightIcon } from "@/components/icons";
import { LiveRoom } from "@/components/live-room";
import { Reveal } from "@/components/reveal";
import { Rise } from "@/components/rise";
import { useLocale } from "@/i18n/locale";

export default function Landing() {
  const { t } = useLocale();
  return (
    <main>
      <section className="mx-auto grid max-w-7xl gap-12 px-4 pt-14 pb-24 sm:px-8 sm:pt-20 lg:grid-cols-12 lg:items-center lg:gap-10">
        <div className="lg:col-span-6">
          <Rise
            as="h1"
            className="text-[52px] leading-[0.95] font-bold tracking-[-0.04em] text-balance sm:text-[84px] xl:text-[96px]"
          >
            {t.landing.title}
          </Rise>
          <Rise as="p" delay={60} className="mt-8 max-w-md text-lg leading-relaxed text-ink/80">
            {t.landing.intro}
          </Rise>
          <Rise delay={120} className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link href="/practice" data-pressable className={`${buttonStyles.ink} sm:w-72`}>
              {t.common.setTheRoom}
              <ArrowRightIcon className={arrowMotion} />
            </Link>
            <a href="#how-it-works" data-pressable className={buttonStyles.outline}>
              {t.landing.howItWorks}
            </a>
          </Rise>
        </div>

        <Rise delay={180} className="lg:col-span-6">
          <LiveRoom />
        </Rise>
      </section>

      <section aria-labelledby="context-title" className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-8 sm:py-24">
          <Reveal className="grid gap-6 border-t-2 border-ink pt-5 lg:grid-cols-12 lg:gap-8">
            <h2
              id="context-title"
              className="text-[40px] leading-none font-bold tracking-[-0.03em] text-balance sm:text-[56px] lg:col-span-7"
            >
              {t.landing.contextTitle}
            </h2>
            <p className="max-w-md text-lg leading-relaxed text-ink/80 lg:col-span-5">
              {t.landing.contextIntro}
            </p>
          </Reveal>
          <Reveal delay={80}>
            <ContextDemo />
          </Reveal>
        </div>
      </section>

      <section
        id="how-it-works"
        aria-labelledby="how-it-works-title"
        className="mx-auto max-w-7xl scroll-mt-8 px-4 pt-20 sm:px-8 sm:pt-24"
      >
        <Reveal
          as="h2"
          id="how-it-works-title"
          className="border-t-2 border-ink pt-5 text-[32px] leading-tight font-bold tracking-tight"
        >
          {t.landing.howItWorks}
        </Reveal>
        <ol className="mt-10 grid gap-10 md:grid-cols-3 md:gap-0">
          {t.landing.steps.map((step, index) => (
            <Reveal
              as="li"
              key={step.title}
              delay={index * 80}
              className="md:border-l md:border-line md:px-8 md:first:border-l-0 md:first:pl-0"
            >
              <p className="text-[15px] font-semibold text-cobalt tabular-nums">
                {t.landing.step(index + 1)}
              </p>
              <h3 className="mt-3 text-[26px] leading-tight font-bold tracking-tight">
                {step.title}
              </h3>
              <p className="mt-3 max-w-xs leading-relaxed text-ink/80">{step.text}</p>
            </Reveal>
          ))}
        </ol>
      </section>

      <section aria-labelledby="ready-title" className="mx-auto max-w-7xl px-4 pt-24 pb-24 sm:px-8">
        <Reveal className="grid gap-8 bg-ink p-8 text-white sm:p-12 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <h2
              id="ready-title"
              className="text-[40px] leading-none font-bold tracking-[-0.03em] sm:text-[56px]"
            >
              {t.landing.readyTitle}
            </h2>
            <p className="mt-5 max-w-lg leading-relaxed text-ink-muted">{t.landing.readyText}</p>
          </div>
          <div className="lg:col-span-5 lg:justify-self-end">
            <Link
              href="/practice"
              data-pressable
              className={`${buttonStyles.white} w-full sm:w-72`}
            >
              {t.common.setTheRoom}
              <ArrowRightIcon className={arrowMotion} />
            </Link>
          </div>
        </Reveal>
      </section>
    </main>
  );
}
