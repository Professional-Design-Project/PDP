import { fireEvent, render, screen, within } from "@testing-library/react";
import { useState } from "react";
import { expect, it } from "vitest";
import { LocaleProvider } from "@/i18n/locale";
import { scenarioGroup, type ScenarioId } from "@/lib/scenarios";
import { InterviewStagePicker } from "./interview-stage-picker";
import { ScenarioPicker } from "./scenario-picker";

function Picker({ disabled = false }: { disabled?: boolean }) {
  const [scenario, setScenario] = useState<ScenarioId>("hr-screening");
  return (
    <>
      <ScenarioPicker value={scenario} disabled={disabled} onChange={setScenario} />
      {scenarioGroup(scenario) === "job-interview" && (
        <InterviewStagePicker value={scenario} disabled={disabled} onChange={setScenario} />
      )}
    </>
  );
}

it("keeps three main scenarios and changes interview stages independently", () => {
  render(
    <LocaleProvider locale="en">
      <Picker />
    </LocaleProvider>,
  );
  const scenarios = screen.getByRole("group", { name: "Scenario" });
  const stages = screen.getByRole("group", { name: "Interview stage" });
  expect(within(scenarios).getAllByRole("radio")).toHaveLength(3);
  expect(within(stages).getByRole("radio", { name: "HR screening" })).toBeChecked();
  fireEvent.click(within(stages).getByRole("radio", { name: "Specialist interview" }));
  expect(within(stages).getByRole("radio", { name: "Specialist interview" })).toBeChecked();
  expect(within(scenarios).getByRole("radio", { name: /Job interview/ })).toBeChecked();
  fireEvent.click(within(scenarios).getByRole("radio", { name: /Oral exam/ }));
  expect(screen.queryByRole("group", { name: "Interview stage" })).not.toBeInTheDocument();
});

it("locks stage selection during a session", () => {
  render(
    <LocaleProvider locale="pl">
      <Picker disabled />
    </LocaleProvider>,
  );
  const stages = screen.getByRole("group", { name: "Etap rozmowy" });
  for (const radio of within(stages).getAllByRole("radio")) expect(radio).toBeDisabled();
});
