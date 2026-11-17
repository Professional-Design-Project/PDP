"use client";

import { useLocale } from "@/i18n/locale";
import type { DocumentKind, SessionDocument } from "@/lib/documents";

type KindSelectProps = {
  document: SessionDocument;
  kinds: DocumentKind[];
  disabled: boolean;
  onKindChange: (id: string, kind: DocumentKind) => void;
};

export function KindSelect({ document, kinds, disabled, onKindChange }: KindSelectProps) {
  const { t } = useLocale();
  return (
    <select
      value={document.kind}
      disabled={disabled}
      aria-label={`${t.documents.usedAs}: ${document.name}`}
      onChange={(event) => onKindChange(document.id, event.target.value as DocumentKind)}
      className="h-9 w-full border border-line bg-white px-2 text-[14px] focus-visible:border-ink focus-visible:outline-none disabled:bg-raised disabled:text-muted"
    >
      {kinds.map((kind) => (
        <option key={kind} value={kind}>
          {t.documents.kinds[kind]}
        </option>
      ))}
    </select>
  );
}
