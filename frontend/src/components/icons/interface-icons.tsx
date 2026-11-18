import { type IconProps, StrokeIcon } from "./stroke-icon";

export function ArrowRightIcon({ className }: IconProps) {
  return (
    <StrokeIcon className={className} strokeWidth="2" strokeLinecap="square">
      <path d="M4 12h15M13 6l6 6-6 6" />
    </StrokeIcon>
  );
}

export function TranscriptIcon({ className }: IconProps) {
  return (
    <StrokeIcon className={className}>
      <path d="M4 6h16M4 10h16M4 14h10M4 18h7" />
    </StrokeIcon>
  );
}

export function CloseIcon({ className }: IconProps) {
  return (
    <StrokeIcon className={className}>
      <path d="M6 6l12 12M18 6L6 18" />
    </StrokeIcon>
  );
}

export function UploadIcon({ className }: IconProps) {
  return (
    <StrokeIcon className={className}>
      <path d="M12 16V4M7 9l5-5 5 5M4 15v5h16v-5" />
    </StrokeIcon>
  );
}

export function FileIcon({ className }: IconProps) {
  return (
    <StrokeIcon className={className}>
      <path d="M6 3h8l4 4v14H6ZM14 3v4h4" />
    </StrokeIcon>
  );
}

export function MenuIcon({ className }: IconProps) {
  return (
    <StrokeIcon className={className}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </StrokeIcon>
  );
}
