"use client";

import { useEffect, useRef, type ReactNode } from "react";

type CaptionScrollProps = {
  follow: string;
  children: ReactNode;
};

function showNewest(element: HTMLDivElement) {
  element.scrollTop = element.scrollHeight;
  element.dataset.clipped = String(element.scrollHeight > element.clientHeight + 1);
}

export function CaptionScroll({ follow, children }: CaptionScrollProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => showNewest(element));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (ref.current) showNewest(ref.current);
  }, [follow]);

  return (
    <div
      ref={ref}
      data-testid="caption-scroll"
      className="caption-fade min-h-0 shrink overflow-hidden"
    >
      {children}
    </div>
  );
}
