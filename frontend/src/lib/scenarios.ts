export type ScenarioId = "job-interview" | "thesis-defence" | "oral-exam";

export const scenarioIds: ScenarioId[] = ["job-interview", "thesis-defence", "oral-exam"];

export const scenarioCopy: Record<
  ScenarioId,
  { title: string; description: string; placeholder: string; finished: string }
> = {
  "job-interview": {
    title: "Job interview",
    description: "Questions about your experience and the role. One interviewer.",
    placeholder:
      "For example: junior backend developer at a fintech, second round, they asked about system design last time.",
    finished: "Interview finished.",
  },
  "thesis-defence": {
    title: "Thesis defence",
    description: "Questions and objections from a committee chair. Based on your thesis.",
    placeholder:
      "For example: master's thesis on battery state estimation with a Kalman filter. The review says the choice of method is not justified enough.",
    finished: "Defence finished.",
  },
  "oral-exam": {
    title: "Oral exam",
    description: "Questions from the topics of your subject. One examiner.",
    placeholder:
      "For example: second-year exam in operating systems. Topics: processes and threads, scheduling, memory management, file systems.",
    finished: "Exam finished.",
  },
};
