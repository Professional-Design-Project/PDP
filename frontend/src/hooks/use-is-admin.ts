"use client";

import { useEffect, useState } from "react";
import { isAdmin } from "@/lib/reports";
import { browserClient } from "@/lib/supabase/client";

export function useIsAdmin(userId: string | undefined) {
  const [admin, setAdmin] = useState<{ userId: string; value: boolean } | null>(null);

  useEffect(() => {
    const supabase = browserClient();
    if (!supabase || !userId) return;
    let active = true;
    isAdmin(supabase)
      .then((value) => active && setAdmin({ userId, value }))
      .catch(() => active && setAdmin({ userId, value: false }));
    return () => {
      active = false;
    };
  }, [userId]);

  return Boolean(userId && admin?.userId === userId && admin.value);
}
