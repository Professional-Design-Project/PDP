"use client";

import { useEffect, useRef, useState } from "react";
import { loadPreset, PRESET_PARAM, type PracticePreset } from "@/lib/practice-preset";
import { browserClient } from "@/lib/supabase/client";

export function usePracticePreset(apply: (preset: PracticePreset) => void) {
  const [preset, setPreset] = useState<PracticePreset | null>(null);
  const applyRef = useRef(apply);

  useEffect(() => {
    applyRef.current = apply;
  });

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get(PRESET_PARAM);
    const supabase = browserClient();
    if (!id || !supabase) return;
    let active = true;
    loadPreset(supabase, id)
      .then((loaded) => {
        if (!active || !loaded) return;
        applyRef.current(loaded);
        setPreset(loaded);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  return { preset, dismiss: () => setPreset(null) };
}
