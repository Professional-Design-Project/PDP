import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { DeleteSession } from "@/components/history/delete-session";
import { LocaleProvider } from "@/i18n/locale";

const replace = vi.fn();
const deleted = vi.fn();
const removed = vi.fn();

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));
vi.mock("@/lib/supabase/client", () => ({
  browserClient: () => ({
    auth: { getSession: async () => ({ data: { session: { user: { id: "user-1" } } } }) },
    storage: {
      from: (bucket: string) => ({
        remove: async (paths: string[]) => {
          removed(bucket, paths);
          return { data: [], error: null };
        },
      }),
    },
    from: () => ({
      delete: () => ({
        eq: (_column: string, id: string) => ({ select: () => deleted(id) }),
      }),
    }),
  }),
}));

beforeEach(() => {
  replace.mockClear();
  deleted.mockReset();
  removed.mockClear();
});

function renderDelete() {
  render(
    <LocaleProvider locale="pl">
      <DeleteSession id="abc" />
    </LocaleProvider>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Usuń sesję" }));
  fireEvent.click(screen.getByRole("button", { name: "Tak, usuń ją" }));
}

it("asks first, deletes the session and goes back to the history", async () => {
  deleted.mockResolvedValue({ data: [{ id: "abc" }], error: null });
  renderDelete();
  await waitFor(() => expect(replace).toHaveBeenCalledWith("/pl/history"));
  expect(deleted).toHaveBeenCalledWith("abc");
  expect(removed).toHaveBeenCalledWith("recordings", ["user-1/abc"]);
});

it("says so when nothing was deleted", async () => {
  deleted.mockResolvedValue({ data: [], error: null });
  renderDelete();
  expect(await screen.findByRole("alert")).toHaveTextContent("Nie udało się usunąć sesji.");
  expect(replace).not.toHaveBeenCalled();
});
