import { scenarioGroup, type ScenarioGroup, type ScenarioId } from "@/lib/scenarios";

export type DocumentKind =
  | "cv"
  | "job_post"
  | "cover_letter"
  | "thesis"
  | "review"
  | "slides"
  | "notes"
  | "topics"
  | "other";

export type SessionDocument = {
  id: string;
  name: string;
  size: number;
  kind: DocumentKind;
  status: "reading" | "ready" | "error";
  text: string;
  truncated: boolean;
  error: "type" | "size" | "empty" | "read" | null;
};

export const MAX_DOCUMENTS = 5;
export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const ACCEPTED = ".pdf,.docx,.pptx,.txt,.md";

const extensions = [".pdf", ".docx", ".pptx", ".txt", ".md"];

const scenarioKinds: Record<ScenarioGroup, DocumentKind[]> = {
  "job-interview": ["cv", "job_post", "cover_letter", "other"],
  "thesis-defence": ["thesis", "review", "slides", "other"],
  "oral-exam": ["topics", "notes", "slides", "other"],
};

export function kindsFor(scenario: ScenarioId): DocumentKind[] {
  return scenarioKinds[scenarioGroup(scenario)];
}

const hints: [RegExp, DocumentKind][] = [
  [/\b(cv|resume|życiorys|zyciorys)\b/i, "cv"],
  [/(ogłoszen|ogloszen|oferta|job|posting|offer)/i, "job_post"],
  [/(cover|list.?motywac|motivation)/i, "cover_letter"],
  [/(recenz|review)/i, "review"],
  [/(prezent|slides|\.pptx$)/i, "slides"],
  [/(praca|thesis|dyplom|magister|inżynier|inzynier)/i, "thesis"],
  [/(zagadnien|zagadnień|topics|pytania|questions)/i, "topics"],
  [/(notat|notes|wyklad|wykład|lecture)/i, "notes"],
];

export function guessKind(name: string, scenario: ScenarioId): DocumentKind {
  const allowed = kindsFor(scenario);
  const matches = hints.filter(([pattern]) => pattern.test(name)).map(([, kind]) => kind);
  const match = matches.find((kind) => allowed.includes(kind));
  if (match) return match;
  return matches.length ? "other" : allowed[0];
}

export function checkFile(file: File): SessionDocument["error"] {
  const name = file.name.toLowerCase();
  if (!extensions.some((extension) => name.endsWith(extension))) return "type";
  if (file.size > MAX_FILE_BYTES) return "size";
  return null;
}

export function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
