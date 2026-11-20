import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { RecordingSection } from "@/components/session/recording-section";
import type { RecordingState } from "@/hooks/use-recording";
import { LocaleProvider } from "@/i18n/locale";
import { deleteRecording } from "@/lib/recordings";

vi.mock("@/lib/supabase/client", () => ({ browserClient: () => ({}) }));
vi.mock("@/lib/recordings", () => ({ deleteRecording: vi.fn() }));

beforeEach(() => vi.mocked(deleteRecording).mockReset());

function renderSection(state: RecordingState) {
  const handlers = { onSave: vi.fn(), onDeleted: vi.fn() };
  render(
    <LocaleProvider locale="en">
      <RecordingSection state={state} {...handlers} />
    </LocaleProvider>,
  );
  return handlers;
}

it("lets the user delete a saved recording right from the summary", async () => {
  vi.mocked(deleteRecording).mockResolvedValue(undefined);
  const handlers = renderSection({ status: "saved", url: "blob:take", sessionId: "session-1" });
  expect(screen.getByText(/You can delete it at any time/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Delete the recording" }));
  fireEvent.click(screen.getByRole("button", { name: "Yes, delete it" }));
  await vi.waitFor(() => expect(handlers.onDeleted).toHaveBeenCalled());
  expect(deleteRecording).toHaveBeenCalledWith({}, "session-1");
});

it("shows that the recording is gone after deleting it", () => {
  renderSection({ status: "deleted", sessionId: "session-1" });
  expect(screen.getByText(/The recording was deleted/)).toBeInTheDocument();
  expect(document.querySelector("audio")).toBeNull();
  expect(screen.queryByRole("button", { name: "Delete the recording" })).not.toBeInTheDocument();
});

it("offers no delete button before the recording is saved", () => {
  renderSection({ status: "undecided", url: "blob:take", sessionId: "session-1" });
  expect(screen.getByRole("button", { name: "Save the recording" })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Delete the recording" })).not.toBeInTheDocument();
});
