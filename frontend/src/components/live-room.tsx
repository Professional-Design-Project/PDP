"use client";

import { useEffect, useRef, useState } from "react";
import { PersonaPortrait, type PersonaTint } from "@/components/persona-portrait";
import { SpeakingBars } from "@/components/speaking-bars";
import { useLocale } from "@/i18n/locale";

const TURN_MS = 5200;

const tints: PersonaTint[] = ["amber", "slate", "sage"];

export function LiveRoom() {
  const { t } = useLocale();
  const turns = t.room.turns;
  const [current, setCurrent] = useState(1);
  const [running, setRunning] = useState(false);
  const roomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const room = roomRef.current;
    if (!room || !("IntersectionObserver" in window) || !window.matchMedia) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let visible = false;
    const update = () => setRunning(visible && !document.hidden && !reduced.matches);
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      update();
    });
    observer.observe(room);
    document.addEventListener("visibilitychange", update);
    reduced.addEventListener("change", update);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", update);
      reduced.removeEventListener("change", update);
    };
  }, []);

  useEffect(() => {
    if (!running) return;
    const timer = window.setTimeout(
      () => setCurrent((index) => (index + 1) % tints.length),
      TURN_MS,
    );
    return () => window.clearTimeout(timer);
  }, [running, current]);

  const turn = turns[current];

  return (
    <div ref={roomRef} className="border border-ink bg-white">
      <div className="grid grid-cols-3">
        {turns.map((person, index) => {
          const speaking = index === current;
          return (
            <button
              key={tints[index]}
              type="button"
              aria-pressed={speaking}
              aria-label={t.room.hear(person.role)}
              onClick={() => setCurrent(index)}
              className={`group relative flex flex-col items-start gap-3 p-3 text-left duration-500 not-first:border-l not-first:border-line focus-visible:z-10 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ink sm:p-4 ${
                speaking ? "bg-cobalt text-white" : "bg-white text-ink hover:bg-raised"
              }`}
            >
              <PersonaPortrait
                tint={tints[index]}
                className={`aspect-square w-full transition-[filter] duration-500 ${
                  speaking ? "" : "grayscale-[35%] group-hover:grayscale-0"
                }`}
              />
              <span className="text-[15px] leading-tight font-semibold sm:text-base">
                {person.role}
              </span>
              <span
                className={`inline-flex items-center gap-2 text-[13px] ${speaking ? "font-semibold" : "text-muted"}`}
              >
                {speaking ? <SpeakingBars className="h-3" /> : <span className="size-2 bg-line" />}
                {speaking ? t.common.speaking : t.common.listening}
              </span>
              {speaking && running && (
                <span
                  key={current}
                  aria-hidden="true"
                  className="absolute inset-x-0 bottom-0 h-[3px] origin-left animate-turn bg-white/70"
                  style={{ animationDuration: `${TURN_MS}ms` }}
                />
              )}
            </button>
          );
        })}
      </div>

      <div className="border-t border-ink p-5 sm:p-7" aria-live="polite">
        <blockquote
          key={turn.quote}
          className="min-h-[3.6em] animate-caption text-[26px] leading-[1.18] font-medium tracking-tight sm:text-[32px]"
        >
          {t.common.quote(turn.quote)}
        </blockquote>
        <p
          key={turn.why}
          className="mt-5 animate-caption text-[14px] text-muted [animation-delay:120ms]"
        >
          <span className="font-semibold text-ink">{t.common.whyThisQuestion}</span> {turn.why}
        </p>
      </div>
    </div>
  );
}
