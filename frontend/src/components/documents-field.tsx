"use client";

import { DocumentRow } from "@/components/documents/document-row";
import { DropZone } from "@/components/documents/drop-zone";
import { useLocale } from "@/i18n/locale";
import { MAX_DOCUMENTS, type DocumentKind, type SessionDocument } from "@/lib/documents";

type DocumentsFieldProps = {
  documents: SessionDocument[];
  kinds: DocumentKind[];
  disabled: boolean;
  onAdd: (files: File[]) => void;
  onRemove: (id: string) => void;
  onKindChange: (id: string, kind: DocumentKind) => void;
};

export function DocumentsField({
  documents,
  kinds,
  disabled,
  onAdd,
  onRemove,
  onKindChange,
}: DocumentsFieldProps) {
  const { t } = useLocale();
  return (
    <div>
      <p className="font-semibold">{t.documents.title}</p>
      <p className="mt-1 max-w-xl text-[15px] text-muted">{t.documents.intro}</p>
      <DropZone disabled={disabled} full={documents.length >= MAX_DOCUMENTS} onAdd={onAdd} />
      {documents.length > 0 && (
        <table className="mt-4 w-full text-left text-[15px]">
          <thead>
            <tr className="border-b border-ink text-[13px] text-muted">
              <th className="py-2 pr-3 font-semibold">{t.documents.file}</th>
              <th className="w-44 py-2 pr-3 font-semibold max-sm:hidden">{t.documents.usedAs}</th>
              <th className="w-20 py-2 pr-3 text-right font-semibold max-sm:hidden">
                {t.documents.size}
              </th>
              <th className="w-10 py-2">
                <span className="sr-only">{t.documents.actions}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {documents.map((document) => (
              <DocumentRow
                key={document.id}
                document={document}
                kinds={kinds}
                disabled={disabled}
                onRemove={onRemove}
                onKindChange={onKindChange}
              />
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
