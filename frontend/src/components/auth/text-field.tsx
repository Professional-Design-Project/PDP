type TextFieldProps = {
  id: string;
  label: string;
  type: "email" | "password";
  value: string;
  autoComplete: string;
  hint?: string;
  disabled?: boolean;
  onChange: (value: string) => void;
};

export function TextField({
  id,
  label,
  type,
  value,
  autoComplete,
  hint,
  disabled,
  onChange,
}: TextFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="font-semibold">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        required
        autoComplete={autoComplete}
        disabled={disabled}
        aria-describedby={hint ? `${id}-hint` : undefined}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 block h-12 w-full border border-line bg-white px-3 focus-visible:border-ink focus-visible:outline-none disabled:bg-raised disabled:text-muted"
      />
      {hint && (
        <p id={`${id}-hint`} className="mt-1 text-[13px] text-muted">
          {hint}
        </p>
      )}
    </div>
  );
}
