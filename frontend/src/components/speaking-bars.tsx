const delays = [0, 180, 360, 90, 270];

export function SpeakingBars({ className = "" }: { className?: string }) {
  return (
    <span aria-hidden="true" className={`inline-flex h-4 items-end gap-[3px] ${className}`}>
      {delays.map((delay) => (
        <span
          key={delay}
          className="h-full w-[3px] origin-bottom animate-bar bg-current"
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </span>
  );
}
