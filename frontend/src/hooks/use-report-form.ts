"use client";

import { useState } from "react";
import { REPORT_MAX_LENGTH, sendReport, type ReportKind } from "@/lib/reports";
import { browserClient } from "@/lib/supabase/client";

type SendState = "idle" | "sending" | "sent" | "failed";

export function useReportForm() {
  const [kind, setKind] = useState<ReportKind>("bug");
  const [message, setMessage] = useState("");
  const [state, setState] = useState<SendState>("idle");

  const ready = message.trim().length > 0 && message.length <= REPORT_MAX_LENGTH;

  async function submit() {
    const supabase = browserClient();
    if (!supabase || !ready) return;
    setState("sending");
    try {
      await sendReport(supabase, kind, message);
      setMessage("");
      setState("sent");
    } catch {
      setState("failed");
    }
  }

  return {
    kind,
    setKind,
    message,
    setMessage,
    state,
    ready,
    submit,
    reset: () => setState("idle"),
  };
}
