export type PersonaTint = "amber" | "slate" | "sage" | "rose";

const backgrounds: Record<PersonaTint, string> = {
  amber: "var(--color-persona-amber)",
  slate: "var(--color-persona-slate)",
  sage: "var(--color-persona-sage)",
  rose: "var(--color-persona-rose)",
};

const ink = "var(--color-ink)";
const shoulders = "M12 120C12 90 32 77 60 77s48 13 48 43Z";

function Amber() {
  return (
    <>
      <path d={shoulders} fill={ink} />
      <rect x="52" y="60" width="16" height="20" fill="#e9c29b" />
      <circle cx="60" cy="47" r="20" fill="#e9c29b" />
      <path d="M40 46c0-15 9-22 20-22s20 7 20 22c-6-7-13-10-20-10s-14 3-20 10Z" fill={ink} />
      <g fill="none" stroke={ink} strokeWidth="2.5">
        <circle cx="52" cy="50" r="6" />
        <circle cx="68" cy="50" r="6" />
        <path d="M58 50h4" />
      </g>
    </>
  );
}

function Slate() {
  return (
    <>
      <path d={shoulders} fill="#2b3448" />
      <rect x="52" y="60" width="16" height="20" fill="#e2b48c" />
      <circle cx="60" cy="48" r="20" fill="#e2b48c" />
      <circle cx="60" cy="22" r="8" fill={ink} />
      <path d="M40 48c0-16 9-21 20-21s20 5 20 21c-4-8-10-11-20-11s-16 3-20 11Z" fill={ink} />
      <path d="M54 56q6 4 12 0" fill="none" stroke={ink} strokeWidth="2" strokeLinecap="round" />
    </>
  );
}

function Sage() {
  return (
    <>
      <path d={shoulders} fill={ink} />
      <path d="M50 77l10 17 10-17Z" fill="#ffffff" />
      <path d="M58 82h4l1 12h-6Z" fill={ink} />
      <rect x="52" y="60" width="16" height="20" fill="#d9a27a" />
      <circle cx="60" cy="47" r="20" fill="#d9a27a" />
      <path d="M40 44c0-6 2-10 5-12v14ZM80 44c0-6-2-10-5-12v14Z" fill="#4a5160" />
      <path d="M41 50c2 15 10 21 19 21s17-6 19-21c-6 7-11 9-19 9s-13-2-19-9Z" fill="#4a5160" />
    </>
  );
}

function Rose() {
  return (
    <>
      <path d="M37 50c0-19 10-26 23-26s23 7 23 26v32H37Z" fill={ink} />
      <path d={shoulders} fill="#ffffff" />
      <rect x="52" y="60" width="16" height="20" fill="#c98f6b" />
      <circle cx="60" cy="48" r="19" fill="#c98f6b" />
      <path d="M41 47c2-13 9-18 19-18s17 5 19 18c-8-6-30-6-38 0Z" fill={ink} />
      <circle cx="53" cy="51" r="2" fill={ink} />
      <circle cx="67" cy="51" r="2" fill={ink} />
    </>
  );
}

const figures: Record<PersonaTint, () => React.JSX.Element> = {
  amber: Amber,
  slate: Slate,
  sage: Sage,
  rose: Rose,
};

export function PersonaPortrait({
  tint,
  className = "",
}: {
  tint: PersonaTint;
  className?: string;
}) {
  const Figure = figures[tint];
  return (
    <svg viewBox="0 0 120 120" aria-hidden="true" className={className}>
      <rect width="120" height="120" fill={backgrounds[tint]} />
      <Figure />
    </svg>
  );
}
