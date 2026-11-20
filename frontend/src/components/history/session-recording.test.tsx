import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { SessionRecording } from "@/components/history/session-recording";
import { LocaleProvider } from "@/i18n/locale";
import { deleteRecording, loadRecording } from "@/lib/recordings";

vi.mock("@/lib/supabase/client", () => ({ browserClient: () => ({}) }));
vi.mock("@/lib/recordings", () => ({ loadRecording: vi.fn(), deleteRecording: vi.fn() }));

beforeEach(() => {
  vi.mocked(loadRecording).mockReset();
  vi.mocked(deleteRecording).mockReset();
});

function renderRecording() {
  render(
    <LocaleProvider locale="en">
      <SessionRecording sessionId="session-1" />
    </LocaleProvider>,
  );
}

it("shows nothing when the session has no recording", async () => {
  vi.mocked(loadRecording).mockResolvedValue(null);
  renderRecording();
  await waitFor(() => expect(loadRecording).toHaveBeenCalled());
  expect(screen.queryByRole("heading", { name: "Recording" })).not.toBeInTheDocument();
});

it("deletes only the recording after a confirmation", async () => {
  vi.mocked(loadRecording).mockResolvedValue({
    playUrl: "https://play",
    downloadUrl: "https://download",
    expiresAt: "2026-12-20T10:00:00.000Z",
  });
  vi.mocked(deleteRecording).mockResolvedValue(undefined);
  renderRecording();

  expect(await screen.findByLabelText("Conversation recording")).toHaveAttribute(
    "src",
    "https://play",
  );
  expect(screen.getByRole("link", { name: "Download the recording" })).toHaveAttribute(
    "href",
    "https://download",
  );
  fireEvent.click(screen.getByRole("button", { name: "Delete the recording" }));
  expect(deleteRecording).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Yes, delete it" }));

  expect(await screen.findByText(/The recording was deleted/)).toBeInTheDocument();
  expect(deleteRecording).toHaveBeenCalledWith({}, "session-1");
  expect(screen.queryByLabelText("Conversation recording")).not.toBeInTheDocument();
});

it("keeps the recording and says so when deleting fails", async () => {
  vi.mocked(loadRecording).mockResolvedValue({
    playUrl: "https://play",
    downloadUrl: "https://download",
    expiresAt: "2026-12-20T10:00:00.000Z",
  });
  vi.mocked(deleteRecording).mockRejectedValue(new Error("offline"));
  renderRecording();
  fireEvent.click(await screen.findByRole("button", { name: "Delete the recording" }));
  fireEvent.click(screen.getByRole("button", { name: "Yes, delete it" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("could not be deleted");
  expect(screen.getByLabelText("Conversation recording")).toBeInTheDocument();
});
