import { expect, it } from "vitest";
import { dictionaries } from "@/i18n/locale";
import type { PastSessionDetail } from "@/lib/history";
import { markdownFilename, sessionMarkdown } from "@/lib/session-markdown";

const session: PastSessionDetail = {
  id: "abc",
  scenarioId: "oral-exam",
  language: "pl",
  status: "ended",
  createdAt: "2026-11-18T10:00:00Z",
  duration: 600,
  transcript: [
    { id: "1", role: "assistant", text: "Opowiedz o sobie.", at: 2, interrupted: false },
    { id: "2", role: "user", text: "Studiuję informatykę.", at: 65, interrupted: false },
  ],
  feedback: {
    summary: "Dobre, rzeczowe odpowiedzi.",
    notes: [
      {
        kind: "strength",
        title: "Konkret",
        quote: "Studiuję informatykę.",
        advice: "Dodaj jeden przykład.",
        sequence: 2,
      },
      { kind: "work_on", title: "Tempo", quote: "a\nb", advice: "Mów wolniej.", sequence: null },
    ],
  },
};

it("writes the feedback and the transcript as Markdown", () => {
  const text = sessionMarkdown(session, dictionaries.pl, "pl");
  expect(text).toMatch(/^# Egzamin ustny\n/);
  expect(text).toContain("· 10 minut");
  expect(text).toContain("## Uwagi\n");
  expect(text).toContain(
    "### Tak trzymaj: Konkret\n\n> Studiuję informatykę.\n\nDodaj jeden przykład.",
  );
  expect(text).toContain("### Nad tym popracuj: Tempo\n\n> a\n> b");
  expect(text).toContain("**00:02 Rozmówca:** Opowiedz o sobie.");
  expect(text).toContain("**01:05 Ty:** Studiuję informatykę.");
  expect(text.endsWith("informatykę.\n")).toBe(true);
});

it("says when there is no feedback or transcript", () => {
  const text = sessionMarkdown(
    { ...session, transcript: [], feedback: null },
    dictionaries.en,
    "en",
  );
  expect(text).toContain(dictionaries.en.history.feedbackMissing);
  expect(text).toContain(dictionaries.en.summary.empty);
});

it("names the file after the scenario and the day", () => {
  expect(markdownFilename(session)).toBe("ensaio-oral-exam-2026-11-18.md");
});
