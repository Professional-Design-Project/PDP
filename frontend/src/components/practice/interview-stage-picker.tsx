"use client";

import { useId } from "react";
import { useLocale } from "@/i18n/locale";
import { interviewStages, type InterviewStageId, type ScenarioId } from "@/lib/scenarios";

type InterviewStagePickerProps = {
  value: ScenarioId;
  disabled: boolean;
  onChange: (id: InterviewStageId) => void;
};

export function InterviewStagePicker({ value, disabled, onChange }: InterviewStagePickerProps) {
  const { t } = useLocale();
  const id = useId();
  return (
    <fieldset disabled={disabled} aria-describedby={`${id}-hint`} className="mt-8">
      <legend className="font-semibold">{t.setup.interviewStage}</legend>
      <p id={`${id}-hint`} className="mt-2 max-w-xl text-[15px] leading-relaxed text-muted">
        {t.setup.interviewStageHint}
      </p>
      <div className="mt-4 divide-y divide-line border-y border-line">
        {interviewStages.map((stage) => (
          <label
            key={stage}
            htmlFor={`${id}-${stage}`}
            className="flex cursor-pointer items-start gap-4 px-4 py-5 transition-colors hover:bg-raised has-checked:bg-raised has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ink"
          >
            <input
              id={`${id}-${stage}`}
              type="radio"
              name="interview-stage"
              value={stage}
              checked={value === stage || (value === "job-interview" && stage === "hr-screening")}
              onChange={() => onChange(stage)}
              aria-labelledby={`${id}-${stage}-title`}
              aria-describedby={`${id}-${stage}-description`}
              className="mt-1 size-5 shrink-0 accent-cobalt"
            />
            <span>
              <span id={`${id}-${stage}-title`} className="block text-lg font-semibold">
                {t.scenarios[stage].title}
              </span>
              <span
                id={`${id}-${stage}-description`}
                className="mt-1 block text-[15px] leading-relaxed text-muted"
              >
                {t.scenarios[stage].description}
              </span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
