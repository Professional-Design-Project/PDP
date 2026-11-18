import { formatClock } from "@/components/session/session-state";
import type { Dictionary } from "@/i18n/en";
import type { Locale } from "@/i18n/locale";
import { formatDate } from "@/lib/format";
import type { PastSessionDetail } from "@/lib/history";
import { languageName } from "@/lib/languages";

function quoted(text: string) {
  return text
    .split("\n")
    .map((line) => `> ${line}`)
    .join("\n");
}

function feedbackLines(session: PastSessionDetail, t: Dictionary) {
  if (!session.feedback) return [t.history.feedbackMissing];
  const lines = [`_${t.feedback.notice}_`, "", session.feedback.summary];
  for (const note of session.feedback.notes) {
    const label = note.kind === "strength" ? t.feedback.keep : t.feedback.work;
    lines.push("", `### ${label}: ${note.title}`, "", quoted(note.quote), "", note.advice);
  }
  return lines;
}

function transcriptLines(session: PastSessionDetail, t: Dictionary) {
  if (session.transcript.length === 0) return [t.summary.empty];
  return session.transcript.flatMap((line) => {
    const speaker = line.role === "user" ? t.common.you : t.common.interviewer;
    return [`**${formatClock(line.at)} ${speaker}:** ${line.text}`, ""];
  });
}

export function sessionTitle(session: PastSessionDetail, t: Dictionary, locale: Locale) {
  return `ensaio - ${t.scenarios[session.scenarioId].title} - ${formatDate(session.createdAt, locale)}`;
}

export function sessionMarkdown(session: PastSessionDetail, t: Dictionary, locale: Locale) {
  const minutes = Math.round(session.duration / 60);
  return [
    `# ${t.scenarios[session.scenarioId].title}`,
    "",
    `${formatDate(session.createdAt, locale)} · ${languageName(session.language)} · ${minutes} ${t.summary.minutes}`,
    "",
    `## ${t.feedback.title}`,
    "",
    ...feedbackLines(session, t),
    "",
    `## ${t.summary.transcript}`,
    "",
    ...transcriptLines(session, t),
  ]
    .join("\n")
    .trimEnd()
    .concat("\n");
}

export function markdownFilename(session: PastSessionDetail) {
  return `ensaio-${session.scenarioId}-${session.createdAt.slice(0, 10)}.md`;
}
