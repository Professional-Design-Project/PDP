const delays = [0, 160, 320];

export function Loader({ className = "", label }: { className?: string; label?: string }) {
  return (
    <span
      role={label ? "status" : undefined}
      className={`inline-flex items-center gap-1.5 ${className}`}
    >
      {delays.map((delay) => (
        <span
          key={delay}
          aria-hidden="true"
          className="size-[0.45em] animate-dot bg-current"
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
      {label && <span className="sr-only">{label}</span>}
    </span>
  );
}
