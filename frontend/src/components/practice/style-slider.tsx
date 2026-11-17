"use client";

import type { CSSProperties, KeyboardEvent } from "react";
import { useGlide } from "@/hooks/use-glide";
import { fillPercent, snapStyleValue, styleRanges, type StyleKey } from "@/lib/interview-style";

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

const keySteps: Record<string, number> = {
  ArrowRight: 1,
  ArrowUp: 1,
  PageUp: 1,
  ArrowLeft: -1,
  ArrowDown: -1,
  PageDown: -1,
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
  const { position, jump, glide } = useGlide(value);
  const inputId = `style-${id}`;
  const fill = { "--fill": `${fillPercent(id, position)}%` } as CSSProperties;

  function move(raw: number) {
    jump(raw);
    const snapped = snapStyleValue(id, raw);
    if (snapped !== value) onChange(snapped);
  }

  function settle() {
    glide(value);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    const target =
      event.key === "Home"
        ? min
        : event.key === "End"
          ? max
          : event.key in keySteps
            ? snapStyleValue(id, value + keySteps[event.key] * step)
            : null;
    if (target === null) return;
    event.preventDefault();
    if (target !== value) onChange(target);
    glide(target);
  }

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
          <span key={value} className="inline-block animate-fade text-[40px]">
            {value}
          </span>
          {unit && <span className="ml-1 text-[16px]">{unit}</span>}
        </p>
      </div>
      <div>
        <input
          id={inputId}
          type="range"
          min={min}
          max={max}
          step="any"
          value={position}
          disabled={disabled}
          onChange={(event) => move(Number(event.target.value))}
          onPointerUp={settle}
          onTouchEnd={settle}
          onBlur={settle}
          onKeyDown={onKeyDown}
          aria-valuenow={value}
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
        <span className="font-semibold">{changesLabel}</span>{" "}
        <span key={changes} className="animate-fade">
          {changes}
        </span>
      </p>
    </div>
  );
}
