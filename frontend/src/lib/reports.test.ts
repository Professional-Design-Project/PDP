import type { SupabaseClient } from "@supabase/supabase-js";
import { expect, it, vi } from "vitest";
import { countByStatus, loadAdminReports, sendReport, type Report } from "@/lib/reports";

const row = {
  id: "r1",
  email: "a@example.com",
  kind: "idea",
  message: "Dark mode",
  status: "new",
  created_at: "2026-11-18T20:00:00Z",
};

function client(admin: boolean) {
  const limit = vi.fn(async () => ({ data: [row], error: null }));
  const supabase = {
    rpc: vi.fn(async () => ({ data: admin, error: null })),
    from: vi.fn(() => ({ select: () => ({ order: () => ({ limit }) }) })),
  };
  return { supabase: supabase as unknown as SupabaseClient, limit, from: supabase.from };
}

it("loads the reports only for admins", async () => {
  const admin = client(true);
  expect(await loadAdminReports(admin.supabase)).toEqual([
    {
      id: "r1",
      email: "a@example.com",
      kind: "idea",
      message: "Dark mode",
      status: "new",
      createdAt: "2026-11-18T20:00:00Z",
    },
  ]);
  const user = client(false);
  expect(await loadAdminReports(user.supabase)).toBeNull();
  expect(user.from).not.toHaveBeenCalled();
});

it("sends the trimmed message and nothing else", async () => {
  const insert = vi.fn(async () => ({ error: null }));
  const supabase = { from: () => ({ insert }) } as unknown as SupabaseClient;
  await sendReport(supabase, "bug", "  The mic does nothing \n");
  expect(insert).toHaveBeenCalledWith({ kind: "bug", message: "The mic does nothing" });
});

it("counts the reports in each status", () => {
  const reports = ["new", "done", "new"].map((status) => ({ status })) as Report[];
  expect(countByStatus(reports)).toEqual({ new: 2, in_progress: 0, done: 1 });
});
