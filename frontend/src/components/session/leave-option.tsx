import { useId } from "react";
import { CheckboxBox } from "@/components/checkbox-box";

type LeaveOptionProps = {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

export function LeaveOption({ label, hint, checked, onChange }: LeaveOptionProps) {
  const id = useId();
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer gap-3 border border-line bg-white p-4 hover:border-ink"
    >
      <CheckboxBox id={id} checked={checked} onChange={onChange} />
      <span>
        <span className="block font-semibold">{label}</span>
        <span className="mt-1 block text-[14px] leading-snug text-muted">{hint}</span>
      </span>
    </label>
  );
}
