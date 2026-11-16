import Link from "next/link";
import { arrowMotion, buttonStyles } from "@/components/button-styles";
import { ArrowRightIcon } from "@/components/icons";
import { LiveRoom } from "@/components/live-room";
import { PersonaPortrait, type PersonaTint } from "@/components/persona-portrait";
import { Rise } from "@/components/rise";

const people: { tint: PersonaTint; role: string; line: string }[] = [
  { tint: "amber", role: "A recruiter", line: "Warm, quick, checks the basics." },
  { tint: "slate", role: "A hiring manager", line: "Wants proof you can deliver." },
  { tint: "sage", role: "A tech lead", line: "Asks why, then asks again." },
  { tint: "rose", role: "A team lead", line: "Listens for how you work with people." },
];

const steps = [
  {
    title: "Set the room",
    text: "Describe the role, the company and who you will meet, then check your microphone.",
  },
  {
    title: "Talk it through",
    text: "The interviewer asks, listens and follows up out loud, in real time.",
  },
  {
    title: "Go again",
    text: "Change the context and start a new session until the answers come easily.",
  },
];

export default function Landing() {
  return (
    <main>
      <section className="mx-auto grid max-w-7xl gap-12 px-4 pt-14 pb-24 sm:px-8 sm:pt-20 lg:grid-cols-12 lg:items-center lg:gap-10">
        <div className="lg:col-span-6">
          <Rise
            as="h1"
            className="text-[52px] leading-[0.95] font-bold tracking-[-0.04em] text-balance sm:text-[84px] xl:text-[96px]"
          >
            Rehearse the conversation before it happens.
          </Rise>
          <Rise as="p" delay={120} className="mt-8 max-w-md text-lg leading-relaxed text-ink/80">
            Talk out loud with an AI interviewer that shapes every question around the role you
            describe. In Polish or English, as many times as you need.
          </Rise>
          <Rise delay={220} className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link href="/practice" data-pressable className={`${buttonStyles.ink} sm:w-72`}>
              Set the room
              <ArrowRightIcon className={arrowMotion} />
            </Link>
            <a href="#how-it-works" data-pressable className={buttonStyles.outline}>
              How it works
            </a>
          </Rise>
        </div>

        <Rise delay={320} className="lg:col-span-6">
          <LiveRoom />
        </Rise>
      </section>

      <section aria-labelledby="table-title" className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-8 sm:py-24">
          <div className="grid gap-6 border-t-2 border-ink pt-5 lg:grid-cols-12 lg:gap-8">
            <h2
              id="table-title"
              className="text-[40px] leading-none font-bold tracking-[-0.03em] text-balance sm:text-[56px] lg:col-span-7"
            >
              Who is across the table?
            </h2>
            <p className="max-w-md text-lg leading-relaxed text-ink/80 lg:col-span-5">
              Describe the person you will meet in the context, and the interviewer shapes its
              questions around them.
            </p>
          </div>
          <ul className="mt-12 grid grid-cols-2 border-t border-l border-line lg:grid-cols-4">
            {people.map((person) => (
              <li key={person.role} className="group border-r border-b border-line">
                <div className="overflow-hidden">
                  <PersonaPortrait
                    tint={person.tint}
                    className="aspect-square w-full transition-transform duration-700 ease-(--ease-soft) group-hover:scale-[1.04]"
                  />
                </div>
                <div className="p-4 sm:p-5">
                  <p className="text-lg font-bold">{person.role}</p>
                  <p className="mt-1 text-[15px] leading-snug text-muted">{person.line}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section
        id="how-it-works"
        aria-labelledby="how-it-works-title"
        className="mx-auto max-w-7xl scroll-mt-8 px-4 pt-20 sm:px-8 sm:pt-24"
      >
        <h2
          id="how-it-works-title"
          className="border-t-2 border-ink pt-5 text-[32px] leading-tight font-bold tracking-tight"
        >
          How it works
        </h2>
        <ol className="mt-10 grid gap-10 md:grid-cols-3 md:gap-0">
          {steps.map((step, index) => (
            <li
              key={step.title}
              className="md:border-l md:border-line md:px-8 md:first:border-l-0 md:first:pl-0"
            >
              <p className="text-[15px] font-semibold text-cobalt tabular-nums">Step {index + 1}</p>
              <h3 className="mt-3 text-[26px] leading-tight font-bold tracking-tight">
                {step.title}
              </h3>
              <p className="mt-3 max-w-xs leading-relaxed text-ink/80">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="ready-title" className="mx-auto max-w-7xl px-4 pt-24 pb-24 sm:px-8">
        <div className="grid gap-8 bg-ink p-8 text-white sm:p-12 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <h2
              id="ready-title"
              className="text-[40px] leading-none font-bold tracking-[-0.03em] sm:text-[56px]"
            >
              Ready when you are.
            </h2>
            <p className="mt-5 max-w-lg leading-relaxed text-ink-muted">
              Your interviewer is an artificial intelligence, not a real person, and its voice is
              synthetic. Feedback is also generated by AI and may contain mistakes.
            </p>
          </div>
          <div className="lg:col-span-5 lg:justify-self-end">
            <Link
              href="/practice"
              data-pressable
              className={`${buttonStyles.white} w-full sm:w-72`}
            >
              Set the room
              <ArrowRightIcon className={arrowMotion} />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
