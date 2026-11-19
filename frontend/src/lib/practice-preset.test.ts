import { expect, it } from "vitest";
import { defaultStyle } from "@/lib/interview-style";
import { presetStyle, toPreset } from "@/lib/practice-preset";

const row = {
  scenario_id: "thesis-defence",
  language: "pl",
  context: "Praca o systemach rozproszonych",
  created_at: "2026-11-18T10:00:00Z",
};

it("rebuilds the settings of a past session", () => {
  expect(toPreset(row, { focus: 80, precision: 3, pressure: 1, follow_ups: 0 })).toEqual({
    scenarioId: "thesis-defence",
    language: "pl",
    context: "Praca o systemach rozproszonych",
    style: { focus: 80, precision: 3, pressure: 1, follow_ups: 0 },
    createdAt: "2026-11-18T10:00:00Z",
  });
});

it("uses the default behaviour for sessions saved before it was kept", () => {
  expect(toPreset({ ...row, context: null }, {})?.style).toEqual(defaultStyle);
  expect(toPreset({ ...row, context: null }, undefined)?.context).toBe("");
});

it("keeps stored behaviour inside the allowed range", () => {
  expect(presetStyle({ focus: 47, precision: 9, pressure: "high", follow_ups: -1 })).toEqual({
    focus: 50,
    precision: 3,
    pressure: defaultStyle.pressure,
    follow_ups: 0,
  });
});

it("refuses unknown scenarios, languages and missing sessions", () => {
  expect(toPreset(null, {})).toBeNull();
  expect(toPreset({ ...row, scenario_id: "karaoke" }, {})).toBeNull();
  expect(toPreset({ ...row, language: "de" }, {})).toBeNull();
});

it.each(["hr-screening", "behavioral-interview", "specialist-interview", "job-interview"])(
  "preserves the interview stage %s when practising again",
  (scenario_id) => {
    expect(toPreset({ ...row, scenario_id }, {})?.scenarioId).toBe(scenario_id);
  },
);
