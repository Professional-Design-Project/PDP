import type { SupabaseClient } from "@supabase/supabase-js";
import { API_URL, HttpError } from "@/lib/api";
import type { ConsentChoices } from "@/lib/consent";

export type StoredConsent = ConsentChoices & {
  id: number;
  version: string;
  language: "pl" | "en";
  givenAt: string;
  withdrawnAt: string | null;
};

type ConsentRow = ConsentChoices & {
  id: number;
  version: string;
  language: "pl" | "en";
  given_at: string;
  withdrawn_at: string | null;
};

export async function latestConsent(supabase: SupabaseClient): Promise<StoredConsent | null> {
  const { data, error } = await supabase
    .from("consents")
    .select(
      "id, version, language, voice, transcripts, improvement, outside_eu, given_at, withdrawn_at",
    )
    .order("given_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const row = data as ConsentRow;
  return {
    id: row.id,
    version: row.version,
    language: row.language,
    voice: row.voice,
    transcripts: row.transcripts,
    improvement: row.improvement,
    outside_eu: row.outside_eu,
    givenAt: row.given_at,
    withdrawnAt: row.withdrawn_at,
  };
}

export async function withdrawConsent(supabase: SupabaseClient, id: number) {
  const { error } = await supabase
    .from("consents")
    .update({ withdrawn_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteAccount(token: string) {
  const response = await fetch(`${API_URL}/account`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new HttpError(response.status);
}
