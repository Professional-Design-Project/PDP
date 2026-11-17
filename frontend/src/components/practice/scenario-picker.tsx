"use client";

import { BriefcaseIcon, ExamIcon, GraduationIcon } from "@/components/icons";
import { useLocale } from "@/i18n/locale";
import { scenarioIds, type ScenarioId } from "@/lib/scenarios";

const icons: Record<ScenarioId, typeof BriefcaseIcon> = {
  "job-interview": BriefcaseIcon,
  "thesis-defence": GraduationIcon,
  "oral-exam": ExamIcon,
};

type ScenarioPickerProps = {
  value: ScenarioId;
  disabled: boolean;
  onChange: (id: ScenarioId) => void;
};

export function ScenarioPicker({ value, disabled, onChange }: ScenarioPickerProps) {
  const { t } = useLocale();
  return (
    <fieldset disabled={disabled} className="grid border-t border-l border-line sm:grid-cols-3">
      <legend className="sr-only">{t.setup.scenario}</legend>
      {scenarioIds.map((id) => {
        const Icon = icons[id];
        return (
          <label
            key={id}
            className="group flex min-h-44 flex-col border-r border-b border-line bg-white p-5 text-ink duration-300 hover:bg-raised has-checked:border-cobalt has-checked:bg-cobalt has-checked:text-white has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ink"
          >
            <input
              type="radio"
              name="scenario"
              value={id}
              checked={value === id}
              onChange={() => onChange(id)}
              className="sr-only"
            />
            <Icon className="size-6 transition-transform duration-300 ease-(--ease-soft) group-hover:-translate-y-0.5" />
            <span className="pt-10 text-[22px] leading-tight font-bold">
              {t.scenarios[id].title}
            </span>
            <span className="mt-2 text-[15px] text-muted group-has-checked:text-white/85">
              {t.scenarios[id].description}
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}
