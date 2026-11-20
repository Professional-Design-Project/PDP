import type { SupabaseClient } from "@supabase/supabase-js";
import { beforeEach, expect, it, vi } from "vitest";
import { deleteRecording, loadRecording, uploadRecording } from "./recordings";

const upload = vi.fn();
const list = vi.fn();
const createSignedUrl = vi.fn();
const remove = vi.fn();
const bucket = vi.fn();

function client(signedIn = true) {
  return {
    auth: {
      getSession: async () => ({
        data: { session: signedIn ? { user: { id: "user-1" } } : null },
      }),
    },
    storage: {
      from: (name: string) => {
        bucket(name);
        return { upload, list, createSignedUrl, remove };
      },
    },
  } as unknown as SupabaseClient;
}

beforeEach(() => {
  for (const mock of [upload, list, createSignedUrl, remove, bucket]) mock.mockReset();
});

it("uploads into the owner's folder without overwriting", async () => {
  upload.mockResolvedValue({ data: {}, error: null });
  const take = new Blob(["audio"], { type: "audio/webm;codecs=opus" });
  await uploadRecording(client(), "session-1", take);
  expect(bucket).toHaveBeenCalledWith("recordings");
  expect(upload).toHaveBeenCalledWith("user-1/session-1", take, {
    contentType: "audio/webm",
    upsert: false,
  });
});

it("treats an already saved recording as saved", async () => {
  upload.mockResolvedValue({ data: null, error: { statusCode: "409", message: "exists" } });
  await expect(uploadRecording(client(), "session-1", new Blob())).resolves.toBeUndefined();
});

it("rethrows other upload errors and needs a signed-in user", async () => {
  upload.mockResolvedValue({ data: null, error: { statusCode: "403", message: "denied" } });
  await expect(uploadRecording(client(), "session-1", new Blob())).rejects.toMatchObject({
    statusCode: "403",
  });
  await expect(uploadRecording(client(false), "session-1", new Blob())).rejects.toThrow(
    "Sign in required",
  );
});

it("returns signed play and download links for a saved recording", async () => {
  list.mockResolvedValue({
    data: [{ name: "session-1", metadata: { mimetype: "audio/mp4" } }],
    error: null,
  });
  createSignedUrl
    .mockResolvedValueOnce({ data: { signedUrl: "https://play" }, error: null })
    .mockResolvedValueOnce({ data: { signedUrl: "https://download" }, error: null });
  await expect(loadRecording(client(), "session-1")).resolves.toEqual({
    playUrl: "https://play",
    downloadUrl: "https://download",
  });
  expect(list).toHaveBeenCalledWith("user-1", { search: "session-1", limit: 10 });
  expect(createSignedUrl).toHaveBeenLastCalledWith("user-1/session-1", 3600, {
    download: "ensaio-session-1.m4a",
  });
});

it("returns nothing when the session has no recording", async () => {
  list.mockResolvedValue({ data: [{ name: "session-10" }], error: null });
  await expect(loadRecording(client(), "session-1")).resolves.toBeNull();
  expect(createSignedUrl).not.toHaveBeenCalled();
});

it("removes the recording from the owner's folder", async () => {
  remove.mockResolvedValue({ data: [], error: null });
  await deleteRecording(client(), "session-1");
  expect(remove).toHaveBeenCalledWith(["user-1/session-1"]);
});
