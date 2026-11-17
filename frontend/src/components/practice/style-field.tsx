"use client";

import { StyleSlider } from "@/components/practice/style-slider";
import { useLocale } from "@/i18n/locale";
import type { InterviewStyle, StyleKey } from "@/lib/interview-style";
import type { ScenarioId } from "@/lib/scenarios";

type StyleFieldProps = {
  scenario: ScenarioId;
  value: InterviewStyle;
  disabled: boolean;
  onChange: (value: InterviewStyle) => void;
};

export function StyleField({ scenario, value, disabled, onChange }: StyleFieldProps) {
  const { t } = useLocale();
  const copy = t.setup.style;
  const set = (key: StyleKey) => (next: number) => onChange({ ...value, [key]: next });
  const shared = { changesLabel: copy.changes, disabled };
  return (
    <div className="grid gap-px border border-line bg-line md:grid-cols-2">
      <StyleSlider
        {...shared}
        id="focus"
        title={copy.focus.title}
        value={value.focus}
        unit="%"
        ends={copy.focus.ends[scenario]}
        changes={copy.focus.explain(value.focus)}
        onChange={set("focus")}
      />
      <StyleSlider
        {...shared}
        id="precision"
        title={copy.precision.title}
        value={value.precision}
        unit={copy.outOf(3)}
        ends={copy.precision.ends}
        changes={copy.precision.levels[value.precision - 1]}
        onChange={set("precision")}
      />
      <StyleSlider
        {...shared}
        id="pressure"
        title={copy.pressure.title}
        value={value.pressure}
        unit={copy.outOf(3)}
        ends={copy.pressure.ends}
        changes={copy.pressure.levels[value.pressure - 1]}
        onChange={set("pressure")}
      />
      <StyleSlider
        {...shared}
        id="follow_ups"
        title={copy.followUps.title}
        value={value.follow_ups}
        ends={copy.followUps.ends}
        changes={copy.followUps.explain(value.follow_ups)}
        onChange={set("follow_ups")}
      />
    </div>
  );
}
