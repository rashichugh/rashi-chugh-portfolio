"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, TriangleAlert, X } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from "react";

type DialogOptions = {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
};

type ActiveDialog = DialogOptions & {
  kind: "alert" | "confirm";
  resolve: (confirmed: boolean) => void;
};

type DialogContextValue = {
  showAlert: (options: DialogOptions) => Promise<void>;
  showConfirm: (options: DialogOptions) => Promise<boolean>;
};

const DialogContext = createContext<DialogContextValue | null>(null);

export function useDialog() {
  const value = useContext(DialogContext);
  if (!value) throw new Error("useDialog must be used inside DialogProvider");
  return value;
}

export function DialogProvider({ children }: { children: ReactNode }) {
  const [dialog, setDialog] = useState<ActiveDialog | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const messageId = useId();

  const showAlert = useCallback((options: DialogOptions) => new Promise<void>((resolve) => {
    previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setDialog({ ...options, kind: "alert", resolve: () => resolve() });
  }), []);

  const showConfirm = useCallback((options: DialogOptions) => new Promise<boolean>((resolve) => {
    previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setDialog({ ...options, kind: "confirm", resolve });
  }), []);

  const close = useCallback((confirmed: boolean) => {
    if (!dialog) return;
    dialog.resolve(confirmed);
    setDialog(null);
    requestAnimationFrame(() => previousFocus.current?.focus());
  }, [dialog]);

  useEffect(() => {
    if (!dialog) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const frame = requestAnimationFrame(() => {
      (dialog.kind === "confirm" ? cancelRef.current : confirmRef.current)?.focus();
    });
    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
    };
  }, [dialog]);

  const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      close(false);
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>("button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex='-1'])") ?? []);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const value = useMemo(() => ({ showAlert, showConfirm }), [showAlert, showConfirm]);

  return (
    <DialogContext.Provider value={value}>
      {children}
      <AnimatePresence>
        {dialog ? (
          <motion.div
            className="app-dialog-backdrop"
            data-no-cursor
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onMouseDown={(event) => { if (event.target === event.currentTarget) close(false); }}
          >
            <motion.div
              ref={dialogRef}
              className={`app-dialog ${dialog.danger ? "is-danger" : ""}`}
              role="alertdialog"
              aria-modal="true"
              aria-labelledby={titleId}
              aria-describedby={messageId}
              tabIndex={-1}
              initial={{ opacity: 0, y: 22, scale: 0.96, rotate: -1 }}
              animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 360, damping: 28 }}
              onKeyDown={onKeyDown}
            >
              <button type="button" className="app-dialog-close" onClick={() => close(false)} aria-label="Close dialog"><X size={17} /></button>
              <div className="app-dialog-icon" aria-hidden="true">{dialog.danger ? <TriangleAlert size={25} /> : <Sparkles size={25} />}</div>
              <span className="app-dialog-kicker">RASHI STUDIO · {dialog.kind === "confirm" ? "PLEASE CONFIRM" : "A QUICK NOTE"}</span>
              <h2 id={titleId}>{dialog.title}</h2>
              <p id={messageId}>{dialog.message}</p>
              <div className="app-dialog-actions">
                {dialog.kind === "confirm" ? <button ref={cancelRef} type="button" className="app-dialog-cancel" onClick={() => close(false)}>{dialog.cancelLabel ?? "Cancel"}</button> : null}
                <button ref={confirmRef} type="button" className="app-dialog-confirm" onClick={() => close(true)}>{dialog.confirmLabel ?? (dialog.kind === "confirm" ? "Confirm" : "Got it")}</button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </DialogContext.Provider>
  );
}
