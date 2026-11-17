"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import { useCallback, useEffect, useRef, useState } from "react";
import { browserClient } from "@/lib/supabase/client";

type QueryState<T> = { status: "loading" } | { status: "ready"; data: T } | { status: "error" };

export function useSupabaseQuery<T>(load: (supabase: SupabaseClient) => Promise<T>, key: string) {
  const [state, setState] = useState<QueryState<T>>({ status: "loading" });
  const [version, setVersion] = useState(0);
  const loadRef = useRef(load);

  useEffect(() => {
    loadRef.current = load;
  });

  useEffect(() => {
    const supabase = browserClient();
    if (!supabase) return;
    let active = true;
    loadRef
      .current(supabase)
      .then((data) => active && setState({ status: "ready", data }))
      .catch(() => active && setState({ status: "error" }));
    return () => {
      active = false;
    };
  }, [key, version]);

  const reload = useCallback(() => setVersion((current) => current + 1), []);
  return { state, reload };
}
