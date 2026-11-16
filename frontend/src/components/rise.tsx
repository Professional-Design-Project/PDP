import type { ElementType, ReactNode } from "react";

type RiseProps = {
  as?: ElementType;
  delay?: number;
  className?: string;
  children: ReactNode;
};

export function Rise({ as: Tag = "div", delay = 0, className = "", children }: RiseProps) {
  return (
    <Tag className={`animate-rise ${className}`} style={{ animationDelay: `${delay}ms` }}>
      {children}
    </Tag>
  );
}
