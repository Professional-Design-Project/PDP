"use client";

import { useEffect, useRef } from "react";

export function useModalDialog<T extends HTMLElement>() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const focusRef = useRef<T>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) {
      if (typeof dialog.showModal === "function") dialog.showModal();
      else dialog.setAttribute("open", "");
    }
    focusRef.current?.focus();
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = previous;
    };
  }, []);

  return { dialogRef, focusRef };
}
