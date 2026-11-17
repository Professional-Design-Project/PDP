import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { checkFile, guessKind } from "@/lib/documents";
import { DocumentsField } from "./documents-field";

const ready = {
  id: "1",
  name: "cv.pdf",
  size: 2_400_000,
  kind: "cv" as const,
  status: "ready" as const,
  text: "Java",
  truncated: false,
  error: null,
};

it("lists documents and lets the user change their role and remove them", () => {
  const onRemove = vi.fn();
  const onKindChange = vi.fn();
  render(
    <DocumentsField
      documents={[ready, { ...ready, id: "2", name: "photo.png", status: "error", error: "type" }]}
      kinds={["cv", "job_post", "cover_letter", "other"]}
      disabled={false}
      onAdd={vi.fn()}
      onRemove={onRemove}
      onKindChange={onKindChange}
    />,
  );
  expect(screen.getAllByText("cv.pdf").length).toBeGreaterThan(0);
  expect(screen.getAllByText("2.3 MB")).toHaveLength(2);
  expect(screen.getByRole("alert")).toHaveTextContent("This file type is not supported.");
  fireEvent.change(screen.getAllByLabelText("Used as: cv.pdf")[0], {
    target: { value: "job_post" },
  });
  expect(onKindChange).toHaveBeenCalledWith("1", "job_post");
  fireEvent.click(screen.getByRole("button", { name: "Remove cv.pdf" }));
  expect(onRemove).toHaveBeenCalledWith("1");
});

it("adds dropped files", () => {
  const onAdd = vi.fn();
  render(
    <DocumentsField
      documents={[]}
      kinds={["thesis", "review", "slides", "other"]}
      disabled={false}
      onAdd={onAdd}
      onRemove={vi.fn()}
      onKindChange={vi.fn()}
    />,
  );
  const file = new File(["text"], "recenzja.pdf", { type: "application/pdf" });
  fireEvent.drop(screen.getByText(/Drop files here/).closest("div")!.parentElement!, {
    dataTransfer: { files: [file] },
  });
  expect(onAdd).toHaveBeenCalledWith([file]);
});

it("guesses document roles and rejects unsupported files", () => {
  expect(guessKind("recenzja_pracy.pdf", "thesis-defence")).toBe("review");
  expect(guessKind("prezentacja.pptx", "thesis-defence")).toBe("slides");
  expect(guessKind("Jan_CV.pdf", "job-interview")).toBe("cv");
  expect(guessKind("notes.txt", "job-interview")).toBe("other");
  expect(guessKind("prezentacja.pptx", "job-interview")).toBe("other");
  expect(guessKind("portfolio.pdf", "job-interview")).toBe("cv");
  expect(checkFile(new File(["x"], "photo.png"))).toBe("type");
  expect(checkFile(new File(["x"], "cv.docx"))).toBeNull();
});
