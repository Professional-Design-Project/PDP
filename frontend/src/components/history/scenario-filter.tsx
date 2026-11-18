"use client";

import { useLocale } from "@/i18n/locale";
import type { ScenarioFilter as Filter } from "@/lib/progress";
import type { ScenarioId } from "@/lib/scenarios";

type ScenarioFilterProps = {
  scenarios: ScenarioId[];
  value: Filter;
  onChange: (value: Filter) => void;
};

export function ScenarioFilter({ scenarios, value, onChange }: ScenarioFilterProps) {
  const { t } = useLocale();
  const options: Filter[] = ["all", ...scenarios];
  return (
    <fieldset className="flex flex-wrap gap-2">
      <legend className="sr-only">{t.history.progress.filter}</legend>
      {options.map((option) => (
        <label
          key={option}
          className="cursor-pointer border border-ink px-4 py-2 text-[14px] font-semibold hover:bg-raised has-checked:bg-ink has-checked:text-white has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-cobalt"
        >
          <input
            type="radio"
            name="scenario-filter"
            value={option}
            checked={value === option}
            onChange={() => onChange(option)}
            className="sr-only"
          />
          {option === "all" ? t.history.progress.all : t.scenarios[option].title}
        </label>
      ))}
    </fieldset>
  );
}
