import Link from "next/link";
import { arrowMotion, buttonStyles } from "@/components/button-styles";
import { ArrowRightIcon } from "@/components/icons";
import { Rise } from "@/components/rise";
import { SpeakingBars } from "@/components/speaking-bars";

const numbers = [
  { value: "15", unit: "min", label: "longest session" },
  { value: "2", label: "languages, Polish and English" },
  { value: "2000", label: "characters of context" },
];

const steps = [
  {
    title: "Set the room",
    text: "Pick the scenario, describe the role and the company, and check your microphone.",
  },
  {
    title: "Talk it through",
    text: "The interviewer asks, listens and follows up out loud, in real time.",
  },
  {
    title: "Go again",
    text: "End the session when you are ready and start a new one with a different context.",
  },
];

export default function Landing() {
  return (
    <main>
      <section className="mx-auto grid max-w-7xl gap-12 px-4 pt-14 pb-20 sm:px-8 sm:pt-20 lg:grid-cols-12 lg:gap-8 lg:pb-28">
        <div className="lg:col-span-7">
          <Rise as="p" className="text-[15px] font-semibold text-muted">
            Voice practice for the conversations that matter
          </Rise>
          <Rise
            as="h1"
            delay={80}
            className="mt-5 text-[52px] leading-[0.95] font-bold tracking-[-0.045em] sm:text-[88px] xl:text-[104px]"
          >
            Rehearse the conversation before it happens.
          </Rise>
          <Rise as="p" delay={180} className="mt-8 max-w-lg text-lg leading-relaxed text-ink/80">
            Talk out loud with an AI interviewer that works only with the role and situation you
            describe. Practise in Polish or English, then go again.
          </Rise>
          <Rise delay={260} className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link href="/practice" data-pressable className={`${buttonStyles.ink} sm:w-72`}>
              Set the room
              <ArrowRightIcon className={arrowMotion} />
            </Link>
            <a href="#how-it-works" data-pressable className={buttonStyles.outline}>
              How it works
            </a>
          </Rise>
        </div>

        <Rise delay={340} className="lg:col-span-5 lg:mt-10">
          <figure className="flex h-full min-h-96 flex-col bg-cobalt p-6 text-white sm:p-8">
            <figcaption className="flex items-center justify-between text-[15px]">
              <span className="font-semibold">Interviewer</span>
              <span className="inline-flex items-center gap-2 font-semibold">
                <SpeakingBars />
                Speaking
              </span>
            </figcaption>
            <blockquote className="mt-auto pt-16 text-[30px] leading-[1.15] font-medium tracking-tight sm:text-[36px]">
              “Tell me about a time you handled a difficult deadline.”
            </blockquote>
            <p className="mt-8 border-t border-white/30 pt-4 text-[15px] text-white/85">
              Why this question: the role asks for ownership of delivery.
            </p>
          </figure>
        </Rise>
      </section>

      <section aria-label="In numbers" className="mx-auto max-w-7xl px-4 sm:px-8">
        <dl className="grid border-t-2 border-ink sm:grid-cols-2 lg:grid-cols-4">
          {numbers.map((item, index) => (
            <Rise
              key={item.label}
              delay={420 + index * 70}
              className="border-b border-line py-8 sm:pr-8 lg:border-b-0"
            >
              <dt className="sr-only">{item.label}</dt>
              <dd>
                <span className="text-[64px] leading-none font-bold tracking-[-0.05em] tabular-nums sm:text-[80px]">
                  {item.value}
                </span>
                {item.unit && <span className="ml-1 text-2xl font-bold">{item.unit}</span>}
                <span className="mt-2 block text-muted">{item.label}</span>
              </dd>
            </Rise>
          ))}
          <Rise delay={630} className="py-8 lg:pl-8">
            <p className="font-semibold">Nothing hidden</p>
            <p className="mt-2 text-[15px] leading-relaxed text-muted">
              The interviewer reads only the scenario and the context you write. Change either and
              the conversation changes with it.
            </p>
          </Rise>
        </dl>
      </section>

      <section
        id="how-it-works"
        aria-labelledby="how-it-works-title"
        className="mx-auto max-w-7xl scroll-mt-8 px-4 pt-24 sm:px-8"
      >
        <div className="border-t-2 border-ink pt-5">
          <h2
            id="how-it-works-title"
            className="text-[32px] leading-tight font-bold tracking-tight"
          >
            How it works
          </h2>
        </div>
        <ol className="mt-8 grid border-t border-l border-line md:grid-cols-3">
          {steps.map((step, index) => (
            <li
              key={step.title}
              className="group border-r border-b border-line bg-white p-6 hover:bg-raised sm:p-8"
            >
              <span className="text-[56px] leading-none font-bold tracking-[-0.05em] text-muted tabular-nums transition-colors duration-300 group-hover:text-cobalt">
                {index + 1}
              </span>
              <h3 className="mt-10 text-[22px] font-bold">{step.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-ink/80">{step.text}</p>
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
