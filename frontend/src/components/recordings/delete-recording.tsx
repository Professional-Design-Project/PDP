"use client";

import { useState } from "react";
import { Loader } from "@/components/loader";
import { useLocale } from "@/i18n/locale";
import { deleteRecording } from "@/lib/recordings";
import { browserClient } from "@/lib/supabase/client";

type DeleteRecordingProps = {
  sessionId: string;
  onDeleted: () => void;
};

export function DeleteRecording({ sessionId, onDeleted }: DeleteRecordingProps) {
  const { t } = useLocale();
  const [confirming, setConfirming] = useState(false);
  const [working, setWorking] = useState(false);
  const [failed, setFailed] = useState(false);

  async function remove() {
    const supabase = browserClient();
    if (!supabase) return;
    setWorking(true);
    setFailed(false);
    try {
      await deleteRecording(supabase, sessionId);
      onDeleted();
    } catch {
      setFailed(true);
      setWorking(false);
    }
  }

  return (
    <div className="mt-6">
      {confirming && <p className="text-[15px] text-muted">{t.recording.deleteText}</p>}
      <div className="mt-3 flex flex-wrap gap-3">
        {confirming ? (
          <>
            <button
              type="button"
              onClick={() => void remove()}
              disabled={working}
              className="inline-flex h-12 items-center gap-3 bg-ink px-5 font-semibold text-white hover:bg-ink/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt disabled:opacity-60"
            >
              {working ? t.recording.deleting : t.recording.deleteConfirm}
              {working && <Loader className="text-[16px]" />}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              disabled={working}
              className="h-12 border border-ink px-5 font-semibold hover:bg-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt"
            >
              {t.recording.deleteCancel}
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="h-12 border border-ink px-5 font-semibold hover:bg-ink hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt"
          >
            {t.recording.deleteButton}
          </button>
        )}
      </div>
      {failed && (
        <p role="alert" className="mt-3 text-[14px]">
          {t.recording.deleteFailed}
        </p>
      )}
    </div>
  );
}
