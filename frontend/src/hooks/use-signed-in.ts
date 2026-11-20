"use client";

import { useEffect, useState } from "react";
import { browserClient } from "@/lib/supabase/client";

export function useSignedIn() {
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    const supabase = browserClient();
    if (!supabase) return;
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setSignedIn(session !== null);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  return signedIn;
}
