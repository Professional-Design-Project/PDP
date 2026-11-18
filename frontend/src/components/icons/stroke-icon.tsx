import type { ReactNode } from "react";

export type IconProps = { className?: string };

type StrokeIconProps = IconProps & {
  children: ReactNode;
  strokeWidth?: string;
  strokeLinecap?: "square";
};

export function StrokeIcon({
  className,
  children,
  strokeWidth = "1.75",
  strokeLinecap,
}: StrokeIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap={strokeLinecap}
      aria-hidden="true"
      className={className}
    >
      {children}
    </svg>
  );
}
