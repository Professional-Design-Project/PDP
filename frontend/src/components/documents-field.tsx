"use client";

import { type DragEvent, useRef, useState } from "react";
import { CloseIcon, FileIcon, UploadIcon } from "@/components/icons";
import { Loader } from "@/components/loader";
import { useLocale } from "@/i18n/locale";
import {
  ACCEPTED,
  formatSize,
  MAX_DOCUMENTS,
  type DocumentKind,
  type SessionDocument,
} from "@/lib/documents";

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
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const full = documents.length >= MAX_DOCUMENTS;

  function drop(event: DragEvent) {
    event.preventDefault();
    setDragging(false);
    if (disabled || full) return;
    const files = Array.from(event.dataTransfer.files);
    if (files.length) onAdd(files);
  }

  return (
    <div>
      <p className="font-semibold">{t.documents.title}</p>
      <p className="mt-1 max-w-xl text-[15px] text-muted">{t.documents.intro}</p>

      <div
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled && !full) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={drop}
        className={`mt-3 flex flex-col items-start gap-4 border p-5 transition-colors duration-200 sm:flex-row sm:items-center ${
          dragging ? "border-cobalt bg-cobalt/5" : "border-line bg-white"
        } ${disabled ? "opacity-60" : ""}`}
      >
        <UploadIcon className={`size-6 shrink-0 ${dragging ? "text-cobalt" : "text-muted"}`} />
        <div className="min-w-0 flex-1">
          <p className="text-[15px]">
            {dragging ? (
              t.documents.dropping
            ) : (
              <>
                {t.documents.drop} {t.documents.or}{" "}
                <button
                  type="button"
                  disabled={disabled || full}
                  onClick={() => inputRef.current?.click()}
                  className="font-semibold underline underline-offset-4 hover:text-cobalt focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt disabled:no-underline"
                >
                  {t.documents.add.toLowerCase()}
                </button>
              </>
            )}
          </p>
          <p className="mt-1 text-[13px] text-muted">
            {full ? t.documents.limit : t.documents.hint}
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED}
          disabled={disabled || full}
          aria-label={t.documents.add}
          className="sr-only"
          tabIndex={-1}
          onChange={(event) => {
            const files = Array.from(event.target.files ?? []);
            if (files.length) onAdd(files);
            event.target.value = "";
          }}
        />
      </div>

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
              <tr key={document.id} className="animate-fade border-b border-line align-top">
                <td className="py-3 pr-3">
                  <span className="flex min-w-0 items-start gap-2">
                    <FileIcon className="mt-0.5 size-4 shrink-0 text-muted" />
                    <span className="min-w-0">
                      <span className="block truncate">{document.name}</span>
                      {document.status === "reading" && (
                        <span className="mt-1 inline-flex items-center gap-2 text-[13px] text-muted">
                          <Loader className="text-[14px] text-cobalt" />
                          {t.documents.reading}
                        </span>
                      )}
                      {document.status === "error" && document.error && (
                        <span
                          role="alert"
                          className="mt-1 inline-flex items-center gap-2 text-[13px]"
                        >
                          <span aria-hidden="true" className="size-2 bg-persona-rose" />
                          {t.documents.errors[document.error]}
                        </span>
                      )}
                      {document.status === "ready" && document.truncated && (
                        <span className="mt-1 block text-[13px] text-muted">
                          {t.documents.truncated}
                        </span>
                      )}
                      {document.status !== "error" && (
                        <span className="mt-2 block sm:hidden">
                          <KindSelect
                            document={document}
                            kinds={kinds}
                            disabled={disabled}
                            onKindChange={onKindChange}
                          />
                        </span>
                      )}
                    </span>
                  </span>
                </td>
                <td className="py-2 pr-3 max-sm:hidden">
                  {document.status !== "error" && (
                    <KindSelect
                      document={document}
                      kinds={kinds}
                      disabled={disabled}
                      onKindChange={onKindChange}
                    />
                  )}
                </td>
                <td className="py-3 pr-3 text-right text-muted tabular-nums max-sm:hidden">
                  {formatSize(document.size)}
                </td>
                <td className="py-2 text-right">
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => onRemove(document.id)}
                    aria-label={t.documents.remove(document.name)}
                    className="grid size-9 place-items-center hover:bg-raised hover:text-cobalt focus-visible:outline-2 focus-visible:outline-cobalt"
                  >
                    <CloseIcon className="size-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function KindSelect({
  document,
  kinds,
  disabled,
  onKindChange,
}: {
  document: SessionDocument;
  kinds: DocumentKind[];
  disabled: boolean;
  onKindChange: (id: string, kind: DocumentKind) => void;
}) {
  const { t } = useLocale();
  return (
    <select
      value={document.kind}
      disabled={disabled || document.status === "error"}
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
