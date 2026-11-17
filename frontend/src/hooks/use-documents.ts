"use client";

import { useState } from "react";
import { extractDocument, HttpError } from "@/lib/api";
import {
  checkFile,
  guessKind,
  kindsFor,
  MAX_DOCUMENTS,
  type DocumentKind,
  type SessionDocument,
} from "@/lib/documents";
import type { ScenarioId } from "@/lib/scenarios";

function readError(caught: unknown): SessionDocument["error"] {
  if (!(caught instanceof HttpError)) return "read";
  if (caught.status === 415) return "type";
  if (caught.status === 413) return "size";
  if (caught.status === 422) return "empty";
  return "read";
}

export function useDocuments(scenario: ScenarioId) {
  const [documents, setDocuments] = useState<SessionDocument[]>([]);

  function update(id: string, change: Partial<SessionDocument>) {
    setDocuments((current) =>
      current.map((document) => (document.id === id ? { ...document, ...change } : document)),
    );
  }

  async function read(id: string, file: File) {
    try {
      const result = await extractDocument(file);
      update(id, { status: "ready", text: result.text, truncated: result.truncated });
    } catch (caught) {
      update(id, { status: "error", error: readError(caught) });
    }
  }

  function add(files: File[]) {
    const room = Math.max(0, MAX_DOCUMENTS - documents.length);
    const added = files.slice(0, room).map((file) => {
      const error = checkFile(file);
      const document: SessionDocument = {
        id: `${file.name}-${file.size}-${crypto.randomUUID()}`,
        name: file.name,
        size: file.size,
        kind: guessKind(file.name, scenario),
        status: error ? "error" : "reading",
        text: "",
        truncated: false,
        error,
      };
      return { file, document };
    });
    if (!added.length) return;
    setDocuments((current) => [...current, ...added.map((item) => item.document)]);
    added
      .filter((item) => item.document.status === "reading")
      .forEach((item) => void read(item.document.id, item.file));
  }

  function remove(id: string) {
    setDocuments((current) => current.filter((document) => document.id !== id));
  }

  function setKind(id: string, kind: DocumentKind) {
    update(id, { kind });
  }

  function adaptTo(next: ScenarioId) {
    setDocuments((current) =>
      current.map((document) =>
        kindsFor[next].includes(document.kind)
          ? document
          : { ...document, kind: guessKind(document.name, next) },
      ),
    );
  }

  const ready = documents.filter((document) => document.status === "ready");
  const reading = documents.some((document) => document.status === "reading");

  return { documents, ready, reading, kinds: kindsFor[scenario], add, remove, setKind, adaptTo };
}
