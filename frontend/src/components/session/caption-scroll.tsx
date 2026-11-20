"use client";

import { useEffect, useRef, type ReactNode } from "react";

type CaptionScrollProps = {
  follow: string;
  children: ReactNode;
};

export function CaptionScroll({ follow, children }: CaptionScrollProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, [follow]);

  return (
    <div ref={ref} data-testid="caption-scroll" className="min-h-0 shrink overflow-hidden">
      {children}
    </div>
  );
}
