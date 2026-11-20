type CheckboxBoxProps = {
  id?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

export function CheckboxBox({ id, checked, onChange }: CheckboxBoxProps) {
  return (
    <span className="relative mt-0.5 grid size-5 shrink-0 place-items-center">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="peer size-5 appearance-none border border-ink bg-white transition-colors duration-200 checked:border-cobalt checked:bg-cobalt focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt disabled:opacity-60"
      />
      <svg
        viewBox="0 0 16 16"
        aria-hidden="true"
        className="pointer-events-none absolute size-3.5 scale-50 text-white opacity-0 transition duration-200 ease-(--ease-soft) peer-checked:scale-100 peer-checked:opacity-100"
      >
        <path d="M3 8.5l3 3 7-7" fill="none" stroke="currentColor" strokeWidth="2.2" />
      </svg>
    </span>
  );
}
