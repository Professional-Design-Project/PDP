"use client";

import type { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useLocale } from "@/i18n/locale";
import { localePath } from "@/i18n/paths";
import { browserClient } from "@/lib/supabase/client";
import { authEnabled } from "@/lib/supabase/config";

export function useAuth() {
  const router = useRouter();
  const { locale } = useLocale();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(authEnabled);

  useEffect(() => {
    const supabase = browserClient();
    if (!supabase) return;
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  async function signOut() {
    await browserClient()?.auth.signOut();
    router.replace(localePath(locale, "/"));
    router.refresh();
  }

  return { enabled: authEnabled, user, loading, signOut };
}
