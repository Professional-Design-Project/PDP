export const scenarioGroups = ["job-interview", "thesis-defence", "oral-exam"] as const;
export const interviewStages = [
  "hr-screening",
  "behavioral-interview",
  "specialist-interview",
] as const;

export type ScenarioGroup = (typeof scenarioGroups)[number];
export type InterviewStageId = (typeof interviewStages)[number];
export type ScenarioId = ScenarioGroup | InterviewStageId;

export const scenarioIds: ScenarioId[] = [...scenarioGroups, ...interviewStages];

export function scenarioGroup(id: ScenarioId): ScenarioGroup {
  return id === "thesis-defence" || id === "oral-exam" ? id : "job-interview";
}
