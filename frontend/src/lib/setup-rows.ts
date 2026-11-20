import type { Dictionary } from "@/i18n/en";
import type { Locale } from "@/i18n/locale";
import type { InterviewStyle } from "@/lib/interview-style";
import { languageName } from "@/lib/languages";
import { scenarioGroup, type ScenarioId } from "@/lib/scenarios";

type SetupSummary = {
  scenario: ScenarioId;
  language: Locale;
  context: string;
  documents: number;
  style: InterviewStyle;
  microphone: { label: string } | null;
  microphoneAvailable: boolean;
};

export function setupRows(t: Dictionary, setup: SetupSummary): [string, string][] {
  const group = scenarioGroup(setup.scenario);
  const context = setup.context.trim();
  const microphone = setup.microphone
    ? setup.microphone.label || t.setup.selectedMicrophone
    : setup.microphoneAvailable
      ? t.setup.defaultMicrophone
      : t.setup.mic.unchecked;
  return [
    [t.setup.scenario, t.scenarios[group].title],
    ...(group === "job-interview"
      ? [[t.setup.interviewStage, t.scenarios[setup.scenario].title] as [string, string]]
      : []),
    [t.setup.language, languageName(setup.language)],
    [t.setup.context, context ? t.setup.contextSummary(context.length) : t.setup.noContext],
    [
      t.setup.documentsRow,
      setup.documents ? t.documents.summary(setup.documents) : t.setup.noContext,
    ],
    [t.setup.style.pressure.title, t.setup.style.summary(setup.style.pressure)],
    [t.setup.microphone, microphone],
  ];
}
