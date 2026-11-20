import type { SupabaseClient } from "@supabase/supabase-js";

export const RECORDINGS_BUCKET = "recordings";
export const RECORDING_RETENTION_DAYS = 30;
const DAY_MS = 86_400_000;
const LINK_TTL_SECONDS = 3600;
const EXTENSIONS: Record<string, string> = {
  "audio/webm": "webm",
  "audio/ogg": "ogg",
  "audio/mp4": "m4a",
};

export type SavedRecording = { playUrl: string; downloadUrl: string; expiresAt: string };

async function ownerId(supabase: SupabaseClient) {
  const { data } = await supabase.auth.getSession();
  const id = data.session?.user.id;
  if (!id) throw new Error("Sign in required");
  return id;
}

function isDuplicate(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "statusCode" in error &&
    error.statusCode === "409"
  );
}

export async function uploadRecording(
  supabase: SupabaseClient,
  sessionId: string,
  recording: Blob,
) {
  const path = `${await ownerId(supabase)}/${sessionId}`;
  const { error } = await supabase.storage.from(RECORDINGS_BUCKET).upload(path, recording, {
    contentType: recording.type.split(";")[0] || "audio/webm",
    upsert: false,
  });
  if (error && !isDuplicate(error)) throw error;
}

export async function loadRecording(
  supabase: SupabaseClient,
  sessionId: string,
): Promise<SavedRecording | null> {
  const folder = await ownerId(supabase);
  const bucket = supabase.storage.from(RECORDINGS_BUCKET);
  const { data: files, error } = await bucket.list(folder, { search: sessionId, limit: 10 });
  if (error) throw error;
  const file = files.find((item) => item.name === sessionId);
  if (!file?.created_at) return null;
  const path = `${folder}/${sessionId}`;
  const extension = EXTENSIONS[String(file.metadata?.mimetype)] ?? "webm";
  const [play, download] = await Promise.all([
    bucket.createSignedUrl(path, LINK_TTL_SECONDS),
    bucket.createSignedUrl(path, LINK_TTL_SECONDS, {
      download: `ensaio-${sessionId}.${extension}`,
    }),
  ]);
  if (play.error) throw play.error;
  if (download.error) throw download.error;
  const expiresAt = new Date(
    Date.parse(file.created_at) + RECORDING_RETENTION_DAYS * DAY_MS,
  ).toISOString();
  return { playUrl: play.data.signedUrl, downloadUrl: download.data.signedUrl, expiresAt };
}

export async function deleteRecording(supabase: SupabaseClient, sessionId: string) {
  const path = `${await ownerId(supabase)}/${sessionId}`;
  const { error } = await supabase.storage.from(RECORDINGS_BUCKET).remove([path]);
  if (error) throw error;
}
