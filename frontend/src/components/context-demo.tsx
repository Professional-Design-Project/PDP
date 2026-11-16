"use client";

import { useState } from "react";

const examples = [
  {
    label: "Backend developer",
    context:
      "Junior backend developer at a fintech. Second round with the tech lead. Last time they asked about databases and I froze.",
    questions: [
      { text: "How would you store payments so nothing is ever counted twice?", why: "Fintech" },
      { text: "Walk me through a query you made faster.", why: "Databases came up last time" },
      {
        text: "What would you check first if an API suddenly slowed down?",
        why: "Tech lead round",
      },
    ],
  },
  {
    label: "Product designer",
    context:
      "Mid-level product designer at a travel app. Portfolio review with the head of design. They care about research.",
    questions: [
      {
        text: "Which decision in this project did research change?",
        why: "They care about research",
      },
      { text: "How did you know the redesign worked?", why: "Portfolio review" },
      { text: "Tell me about a time you disagreed with a product manager.", why: "Mid-level role" },
    ],
  },
  {
    label: "Sales associate",
    context:
      "First job, sales associate in an electronics store. Group interview, then a short one-to-one with the store manager.",
    questions: [
      {
        text: "A customer wants a cheaper laptop than the one they need. What do you say?",
        why: "Electronics store",
      },
      { text: "Why do you want to work in sales?", why: "First job" },
      {
        text: "How would you handle a queue and a phone call at the same time?",
        why: "Store manager",
      },
    ],
  },
];

export function ContextDemo() {
  const [current, setCurrent] = useState(0);
  const example = examples[current];

  return (
    <div className="mt-12 grid border border-ink lg:grid-cols-12">
      <div className="border-b border-ink p-5 sm:p-7 lg:col-span-5 lg:border-r lg:border-b-0">
        <fieldset>
          <legend className="text-[13px] font-semibold text-muted">Try an example</legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {examples.map((item, index) => (
              <label
                key={item.label}
                className="inline-flex h-10 items-center border border-ink px-4 text-[15px] font-semibold has-checked:bg-ink has-checked:text-white hover:bg-raised has-checked:hover:bg-ink has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-cobalt"
              >
                <input
                  type="radio"
                  name="context-example"
                  checked={index === current}
                  onChange={() => setCurrent(index)}
                  className="sr-only"
                />
                {item.label}
              </label>
            ))}
          </div>
        </fieldset>

        <p className="mt-8 text-[13px] font-semibold text-muted">Your context</p>
        <p
          key={example.context}
          className="mt-3 animate-caption border border-line bg-canvas p-4 text-lg leading-relaxed"
        >
          {example.context}
          <span
            aria-hidden="true"
            className="ml-0.5 inline-block h-[1.1em] w-[2px] translate-y-[3px] animate-caret bg-cobalt"
          />
        </p>
      </div>

      <div className="p-5 sm:p-7 lg:col-span-7" aria-live="polite">
        <p className="text-[13px] font-semibold text-muted">Questions it leads to</p>
        <ul className="mt-3">
          {example.questions.map((question, index) => (
            <li
              key={`${current}-${question.text}`}
              className="animate-caption border-t border-line py-5 first:border-t-0 first:pt-2"
              style={{ animationDelay: `${120 + index * 110}ms` }}
            >
              <p className="text-[22px] leading-snug font-medium tracking-tight sm:text-[24px]">
                “{question.text}”
              </p>
              <p className="mt-2 text-[14px] text-muted">
                <span className="font-semibold text-cobalt">From your context:</span> {question.why}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
