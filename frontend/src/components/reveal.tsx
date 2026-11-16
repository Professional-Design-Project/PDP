"use client";

import { type ElementType, type ReactNode, useEffect, useRef, useState } from "react";

const hidden = "translate-y-2 opacity-0";
const shown = "translate-y-0 opacity-100";

type RevealProps = {
  id?: string;
  as?: ElementType;
  delay?: number;
  className?: string;
  children: ReactNode;
};

export function Reveal({ as: Tag = "div", id, delay = 0, className = "", children }: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  const [state, setState] = useState<"static" | "waiting" | "shown">("static");

  useEffect(() => {
    const element = ref.current;
    if (!element || !("IntersectionObserver" in window)) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    if (element.getBoundingClientRect().top < window.innerHeight * 0.9) return;
    setState("waiting");
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setState("shown");
        observer.disconnect();
      },
      { rootMargin: "0px 0px -12% 0px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const motion =
    state === "static"
      ? ""
      : `transition-[opacity,transform] duration-500 ease-(--ease-soft) ${
          state === "waiting" ? hidden : shown
        }`;

  return (
    <Tag
      ref={ref}
      id={id}
      className={`${motion} ${className}`}
      style={state === "shown" ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
