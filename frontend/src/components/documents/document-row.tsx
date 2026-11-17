"use client";

import { KindSelect } from "@/components/documents/kind-select";
import { CloseIcon, FileIcon } from "@/components/icons";
import { Loader } from "@/components/loader";
import { useLocale } from "@/i18n/locale";
import { formatSize, type DocumentKind, type SessionDocument } from "@/lib/documents";

type DocumentRowProps = {
  document: SessionDocument;
  kinds: DocumentKind[];
  disabled: boolean;
  onRemove: (id: string) => void;
  onKindChange: (id: string, kind: DocumentKind) => void;
};

function DocumentStatus({ document }: { document: SessionDocument }) {
  const { t } = useLocale();
  if (document.status === "reading") {
    return (
      <span className="mt-1 inline-flex items-center gap-2 text-[13px] text-muted">
        <Loader className="text-[14px] text-cobalt" />
        {t.documents.reading}
      </span>
    );
  }
  if (document.status === "error" && document.error) {
    return (
      <span role="alert" className="mt-1 inline-flex items-center gap-2 text-[13px]">
        <span aria-hidden="true" className="size-2 bg-persona-rose" />
        {t.documents.errors[document.error]}
      </span>
    );
  }
  if (document.truncated) {
    return <span className="mt-1 block text-[13px] text-muted">{t.documents.truncated}</span>;
  }
  return null;
}

export function DocumentRow({
  document,
  kinds,
  disabled,
  onRemove,
  onKindChange,
}: DocumentRowProps) {
  const { t } = useLocale();
  const select =
    document.status === "error" ? null : (
      <KindSelect
        document={document}
        kinds={kinds}
        disabled={disabled}
        onKindChange={onKindChange}
      />
    );
  return (
    <tr className="animate-fade border-b border-line align-top">
      <td className="py-3 pr-3">
        <span className="flex min-w-0 items-start gap-2">
          <FileIcon className="mt-0.5 size-4 shrink-0 text-muted" />
          <span className="min-w-0">
            <span className="block truncate">{document.name}</span>
            <DocumentStatus document={document} />
            {select && <span className="mt-2 block sm:hidden">{select}</span>}
          </span>
        </span>
      </td>
      <td className="py-2 pr-3 max-sm:hidden">{select}</td>
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
  );
}
