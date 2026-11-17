"use client";

import { useState } from "react";
import { useLocale } from "@/i18n/locale";

export function ContextDemo() {
  const { t } = useLocale();
  const examples = t.demo.examples;
  const [current, setCurrent] = useState(0);

  return (
    <div className="mt-12 grid border border-ink lg:grid-cols-12">
      <div className="border-b border-ink p-5 sm:p-7 lg:col-span-5 lg:border-r lg:border-b-0">
        <fieldset>
          <legend className="text-[13px] font-semibold text-muted">{t.demo.tryExample}</legend>
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

        <p className="mt-8 text-[13px] font-semibold text-muted">{t.demo.yourContext}</p>
        <div className="mt-3 grid">
          {examples.map((item, index) => (
            <p
              key={index === current ? `${item.label}-active` : item.label}
              aria-hidden={index !== current}
              className={`col-start-1 row-start-1 border border-line bg-canvas p-4 text-lg leading-relaxed ${index === current ? "animate-caption" : "invisible"}`}
            >
              {item.context}
              <span
                aria-hidden="true"
                className="ml-0.5 inline-block h-[1.1em] w-[2px] translate-y-[3px] animate-caret bg-cobalt"
              />
            </p>
          ))}
        </div>
      </div>

      <div className="p-5 sm:p-7 lg:col-span-7" aria-live="polite">
        <p className="text-[13px] font-semibold text-muted">{t.demo.questions}</p>
        <div className="mt-3 grid">
          {examples.map((item, index) => (
            <ul
              key={item.label}
              aria-hidden={index !== current}
              className={`col-start-1 row-start-1 ${index === current ? "" : "invisible"}`}
            >
              {item.questions.map((question, order) => (
                <li
                  key={index === current ? `${current}-${question.text}` : question.text}
                  className={`border-t border-line py-5 first:border-t-0 first:pt-2 ${index === current ? "animate-caption" : ""}`}
                  style={{ animationDelay: `${order * 50}ms` }}
                >
                  <p className="text-[22px] leading-snug font-medium tracking-tight sm:text-[24px]">
                    {t.common.quote(question.text)}
                  </p>
                  <p className="mt-2 text-[14px] text-muted">
                    <span className="font-semibold text-cobalt">{t.demo.fromContext}</span>{" "}
                    {question.why}
                  </p>
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
    </div>
  );
}
