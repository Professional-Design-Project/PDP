type IconProps = { className?: string };

export function ArrowRightIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="square"
      aria-hidden="true"
      className={className}
    >
      <path d="M4 12h15M13 6l6 6-6 6" />
    </svg>
  );
}

export function BriefcaseIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden="true"
      className={className}
    >
      <rect x="3" y="7" width="18" height="13" />
      <path d="M8 7V4h8v3M3 13h18" />
    </svg>
  );
}

export function MicrophoneIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden="true"
      className={className}
    >
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
    </svg>
  );
}

export function MicrophoneOffIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden="true"
      className={className}
    >
      <path d="M15 10V6a3 3 0 0 0-5.7-1.3M9 9v2a3 3 0 0 0 4.6 2.5M5 11a7 7 0 0 0 11.2 5.6M19 11a7 7 0 0 1-.6 2.8M12 18v3M4 4l16 16" />
    </svg>
  );
}

export function TranscriptIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden="true"
      className={className}
    >
      <path d="M4 6h16M4 10h16M4 14h10M4 18h7" />
    </svg>
  );
}

export function HangUpIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M12 8.5c-3.6 0-6.9 1.2-9.3 3.2-.5.4-.7 1-.6 1.6l.4 2.2c.1.7.8 1.2 1.5 1.1l3.4-.6c.6-.1 1.1-.6 1.2-1.2l.3-1.9c1-.4 2-.6 3.1-.6s2.1.2 3.1.6l.3 1.9c.1.6.6 1.1 1.2 1.2l3.4.6c.7.1 1.4-.4 1.5-1.1l.4-2.2c.1-.6-.1-1.2-.6-1.6-2.4-2-5.7-3.2-9.3-3.2Z" />
    </svg>
  );
}

export function CloseIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden="true"
      className={className}
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function GraduationIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden="true"
      className={className}
    >
      <path d="M2 9l10-5 10 5-10 5ZM6 11v5c2 2 10 2 12 0v-5M22 9v6" />
    </svg>
  );
}

export function ExamIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden="true"
      className={className}
    >
      <path d="M6 3h12v18H6ZM9 8h6M9 12h6M9 16h3" />
    </svg>
  );
}

export function UploadIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden="true"
      className={className}
    >
      <path d="M12 16V4M7 9l5-5 5 5M4 15v5h16v-5" />
    </svg>
  );
}

export function FileIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden="true"
      className={className}
    >
      <path d="M6 3h8l4 4v14H6ZM14 3v4h4" />
    </svg>
  );
}
