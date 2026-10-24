"use client";
import React, { useEffect, useId, useRef } from "react";
export function ConfirmDialog({
  title,
  description,
  confirmLabel = "確認",
  onConfirm = () => {},
  onCancel = () => {},
  busy = false,
  initialFocus = "cancel",
  children,
}: {
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  busy?: boolean;
  initialFocus?: "cancel" | "first-input";
  children?: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null),
    cancel = useRef<HTMLButtonElement>(null),
    label = useId(),
    descriptionId = useId();
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const dialog = ref.current;
    if (dialog) {
      dialog.removeAttribute("open");
      dialog.showModal();
      if (initialFocus === "first-input")
        dialog.querySelector<HTMLElement>("input, textarea, select")?.focus();
      else cancel.current?.focus();
    }
    return () => {
      dialog?.close();
      if (previous?.isConnected) previous.focus();
      else document.querySelector<HTMLElement>("h1")?.focus();
    };
  }, [initialFocus]);
  return (
    <dialog
      open
      ref={ref}
      aria-modal="true"
      aria-labelledby={label}
      aria-describedby={descriptionId}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onCancel();
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          if (!busy) onCancel();
          return;
        }
        if (
          event.key !== "Tab" ||
          event.ctrlKey ||
          event.metaKey ||
          event.altKey
        )
          return;
        const controls = event.currentTarget.querySelectorAll<HTMLElement>(
          'input:not([type="hidden"]):not([disabled]),textarea:not([disabled]),select:not([disabled]),button:not([disabled]),a[href],[tabindex="0"]',
        );
        const first = controls[0],
          last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }}
      className="max-h-[90vh] w-[min(36rem,95vw)] overflow-auto rounded-xl border border-slate-300 bg-white p-6 backdrop:bg-slate-900/40"
    >
      <h2 id={label} className="text-xl font-bold">
        {title}
      </h2>
      <p id={descriptionId} className="my-4 whitespace-pre-wrap">
        {description}
      </p>
      {children}
      <div className="mt-5 flex flex-wrap gap-3">
        <button
          ref={cancel}
          type="button"
          onClick={onCancel}
          disabled={busy}
          data-testid="dialog-cancel"
        >
          取消
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={busy}
          data-testid="dialog-confirm"
        >
          {busy ? "処理中…" : confirmLabel}
        </button>
      </div>
    </dialog>
  );
}
