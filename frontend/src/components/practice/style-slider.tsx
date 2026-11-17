import type { CSSProperties } from "react";
import { fillPercent, styleRanges, type StyleKey } from "@/lib/interview-style";

type StyleSliderProps = {
  id: StyleKey;
  title: string;
  value: number;
  unit?: string;
  ends: readonly [string, string];
  changesLabel: string;
  changes: string;
  disabled: boolean;
  onChange: (value: number) => void;
};

export function StyleSlider({
  id,
  title,
  value,
  unit,
  ends,
  changesLabel,
  changes,
  disabled,
  onChange,
}: StyleSliderProps) {
  const { min, max, step } = styleRanges[id];
  const inputId = `style-${id}`;
  const fill = { "--fill": `${fillPercent(id, value)}%` } as CSSProperties;
  return (
    <div className="flex flex-col gap-4 bg-white p-5 sm:p-6">
      <div className="flex items-end justify-between gap-4">
        <label htmlFor={inputId} className="font-semibold">
          {title}
        </label>
        <p
          aria-hidden="true"
          className="shrink-0 leading-none font-bold tracking-tight tabular-nums"
        >
          <span className="text-[40px]">{value}</span>
          {unit && <span className="ml-1 text-[16px]">{unit}</span>}
        </p>
      </div>
      <div>
        <input
          id={inputId}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(Number(event.target.value))}
          aria-valuetext={unit ? `${value} ${unit}` : String(value)}
          className="style-range"
          style={fill}
        />
        <div aria-hidden="true" className="mt-1 flex justify-between gap-4 text-[13px] text-muted">
          <span>{ends[0]}</span>
          <span className="text-right">{ends[1]}</span>
        </div>
      </div>
      <p aria-live="polite" className="border-t border-line pt-4 text-[15px] leading-relaxed">
        <span className="font-semibold">{changesLabel}</span> {changes}
      </p>
    </div>
  );
}
