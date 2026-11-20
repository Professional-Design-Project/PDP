"use client";

import { LeaveOption } from "@/components/session/leave-option";
import { useLocale } from "@/i18n/locale";

export type EndChoice = { feedback: boolean; recording: boolean };

type EndChoicesProps = {
  value: EndChoice;
  canRecord: boolean;
  onChange: (value: EndChoice) => void;
};

export function EndChoices({ value, canRecord, onChange }: EndChoicesProps) {
  const { t } = useLocale();
  return (
    <fieldset className="mt-6 grid gap-3">
      <legend className="sr-only">{t.leave.options}</legend>
      <LeaveOption
        label={t.leave.feedback}
        hint={t.leave.feedbackHint}
        checked={value.feedback}
        onChange={(feedback) => onChange({ ...value, feedback })}
      />
      {canRecord && (
        <LeaveOption
          label={t.leave.recording}
          hint={t.leave.recordingHint}
          checked={value.recording}
          onChange={(recording) => onChange({ ...value, recording })}
        />
      )}
    </fieldset>
  );
}
