import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { FeedbackSection } from "./feedback-section";
import type { TranscriptLine } from "./session-state";

const transcript: TranscriptLine[] = [
  { id: "4", role: "assistant", text: "What was the risk?", at: 30, interrupted: false },
  { id: "5", role: "user", text: "We tested a lot.", at: 41, interrupted: false },
];

it("offers feedback when the user has not decided", () => {
  const onRequest = vi.fn();
  render(
    <FeedbackSection
      state={{ status: "undecided" }}
      transcript={transcript}
      onRequest={onRequest}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Get feedback" }));
  expect(onRequest).toHaveBeenCalled();
});

it("shows notes linked to the transcript moment", () => {
  render(
    <FeedbackSection
      state={{
        status: "ready",
        result: {
          summary: "A clear start.",
          notes: [
            {
              kind: "strength",
              title: "Clear",
              quote: "We split it",
              advice: "Keep it.",
              sequence: null,
            },
            {
              kind: "work_on",
              title: "Be specific",
              quote: "We tested a lot.",
              advice: "Name one test.",
              sequence: 5,
            },
          ],
        },
      }}
      transcript={transcript}
      onRequest={vi.fn()}
    />,
  );
  expect(screen.getByText("A clear start.")).toBeInTheDocument();
  expect(screen.getByText("Work on this")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "In the transcript at 00:41" })).toHaveAttribute(
    "href",
    "#line-5",
  );
});

it("explains when there is not enough to give feedback on", () => {
  render(<FeedbackSection state={{ status: "unavailable" }} transcript={[]} onRequest={vi.fn()} />);
  expect(screen.getByText(/not enough of your answers/)).toBeInTheDocument();
});
