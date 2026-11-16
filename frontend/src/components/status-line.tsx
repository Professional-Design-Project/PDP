type Tone = "neutral" | "good" | "bad";

const marker: Record<Tone, string> = {
  neutral: "bg-line",
  good: "bg-persona-sage",
  bad: "bg-persona-rose",
};

export function StatusLine({ tone, children }: { tone: Tone; children: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span aria-hidden="true" className={`size-2.5 shrink-0 ${marker[tone]}`} />
      {children}
    </span>
  );
}
