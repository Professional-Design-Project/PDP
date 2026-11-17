"use client";

import { type DragEvent, useRef, useState } from "react";
import { UploadIcon } from "@/components/icons";
import { useLocale } from "@/i18n/locale";
import { ACCEPTED } from "@/lib/documents";

type DropZoneProps = {
  disabled: boolean;
  full: boolean;
  onAdd: (files: File[]) => void;
};

export function DropZone({ disabled, full, onAdd }: DropZoneProps) {
  const { t } = useLocale();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const blocked = disabled || full;

  function drop(event: DragEvent) {
    event.preventDefault();
    setDragging(false);
    if (blocked) return;
    const files = Array.from(event.dataTransfer.files);
    if (files.length) onAdd(files);
  }

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        if (!blocked) setDragging(true);
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
                disabled={blocked}
                onClick={() => inputRef.current?.click()}
                className="font-semibold underline underline-offset-4 hover:text-cobalt focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt disabled:no-underline"
              >
                {t.documents.add.toLowerCase()}
              </button>
            </>
          )}
        </p>
        <p className="mt-1 text-[13px] text-muted">{full ? t.documents.limit : t.documents.hint}</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPTED}
        disabled={blocked}
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
  );
}
