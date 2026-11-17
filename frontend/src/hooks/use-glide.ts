"use client";

import { useEffect, useRef, useState } from "react";

const DURATION = 220;

function easeOut(progress: number) {
  return 1 - (1 - progress) ** 3;
}

function prefersReducedMotion() {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

export function useGlide(value: number) {
  const [position, setPosition] = useState(value);
  const frame = useRef(0);
  const current = useRef(value);

  function jump(next: number) {
    cancelAnimationFrame(frame.current);
    current.current = next;
    setPosition(next);
  }

  function glide(target: number) {
    cancelAnimationFrame(frame.current);
    const from = current.current;
    if (from === target || prefersReducedMotion()) {
      jump(target);
      return;
    }
    const start = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - start) / DURATION, 1);
      const next = from + (target - from) * easeOut(progress);
      current.current = next;
      setPosition(next);
      if (progress < 1) frame.current = requestAnimationFrame(step);
    };
    frame.current = requestAnimationFrame(step);
  }

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  return { position, jump, glide };
}
