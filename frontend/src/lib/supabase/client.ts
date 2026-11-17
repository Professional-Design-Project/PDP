import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { authEnabled, supabaseKey, supabaseUrl } from "@/lib/supabase/config";

let client: SupabaseClient | null = null;

export function browserClient() {
  if (!authEnabled) return null;
  client ??= createBrowserClient(supabaseUrl, supabaseKey);
  return client;
}

export async function accessToken() {
  const supabase = browserClient();
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}
