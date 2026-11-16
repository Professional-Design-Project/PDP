"use client";

import { type ElementType, type ReactNode, useEffect, useRef, useState } from "react";

type RevealStyle = "rise" | "wipe" | "settle";

const hidden: Record<RevealStyle, string> = {
  rise: "translate-y-8 opacity-0",
  wipe: "[clip-path:inset(0_0_100%_0)] opacity-0",
  settle: "scale-[0.97] opacity-0 blur-sm",
};

const shown: Record<RevealStyle, string> = {
  rise: "translate-y-0 opacity-100",
  wipe: "[clip-path:inset(0_0_0_0)] opacity-100",
  settle: "scale-100 opacity-100 blur-none",
};

type RevealProps = {
  id?: string;
  as?: ElementType;
  variant?: RevealStyle;
  delay?: number;
  className?: string;
  children: ReactNode;
};

export function Reveal({
  as: Tag = "div",
  id,
  variant = "rise",
  delay = 0,
  className = "",
  children,
}: RevealProps) {
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
      : `transition-[opacity,transform,clip-path,filter] duration-[900ms] ease-(--ease-soft) ${
          state === "waiting" ? hidden[variant] : shown[variant]
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
