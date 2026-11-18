import { type IconProps, StrokeIcon } from "./stroke-icon";

export function BriefcaseIcon({ className }: IconProps) {
  return (
    <StrokeIcon className={className}>
      <rect x="3" y="7" width="18" height="13" />
      <path d="M8 7V4h8v3M3 13h18" />
    </StrokeIcon>
  );
}

export function GraduationIcon({ className }: IconProps) {
  return (
    <StrokeIcon className={className}>
      <path d="M2 9l10-5 10 5-10 5ZM6 11v5c2 2 10 2 12 0v-5M22 9v6" />
    </StrokeIcon>
  );
}

export function ExamIcon({ className }: IconProps) {
  return (
    <StrokeIcon className={className}>
      <path d="M6 3h12v18H6ZM9 8h6M9 12h6M9 16h3" />
    </StrokeIcon>
  );
}
