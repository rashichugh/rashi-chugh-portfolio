"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Edit3, Eye, LogOut, Plus, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { useDialog } from "@/components/dialog";
import type { AdminContext } from "@/types/content";

type Mode = "preview" | "edit";
type AdminValue = AdminContext & { mode: Mode; setMode: (mode: Mode) => void; isEditing: boolean };
const Admin = createContext<AdminValue | null>(null);

export function useAdmin() {
  const value = useContext(Admin);
  if (!value) throw new Error("useAdmin must be used inside AdminProvider");
  return value;
}

export function AdminProvider({ context, children }: { context: AdminContext; children: React.ReactNode }) {
  const { showConfirm } = useDialog();
  const [mode, setModeState] = useState<Mode>("preview");
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      if (context.isAdmin && sessionStorage.getItem("rashi-admin-mode") === "edit") setModeState("edit");
    });
    return () => cancelAnimationFrame(frame);
  }, [context.isAdmin]);

  const setMode = useCallback((next: Mode) => {
    setModeState(next);
    sessionStorage.setItem("rashi-admin-mode", next);
    setExpanded(false);
  }, []);

  const value = useMemo(() => ({ ...context, mode, setMode, isEditing: context.isAdmin && mode === "edit" }), [context, mode, setMode]);

  return (
    <Admin.Provider value={value}>
      {children}
      {context.isAdmin ? (
        <div className="admin-dock" data-no-cursor>
          <AnimatePresence mode="wait" initial={false}>
            {expanded ? (
              <motion.div
                key="expanded"
                className="admin-menu"
                initial={{ opacity: 0, y: 16, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.97 }}
              >
                <div className="admin-menu-top">
                  <div>
                    <span className="admin-kicker"><Sparkles size={13} /> Rashi Studio</span>
                    <strong>{context.isDemo ? "Browser demo" : context.email}</strong>
                  </div>
                  <button className="icon-button dark" onClick={() => setExpanded(false)} aria-label="Close studio menu"><X size={17} /></button>
                </div>
                <p>{context.isDemo ? "Edits save to this browser. Connect Supabase for shared, persistent publishing." : "Edit content directly on the page, or build a complete project story with blocks."}</p>
                <div className="admin-mode-switch">
                  <button className={mode === "preview" ? "active" : ""} onClick={() => { setMode("preview"); setExpanded(false); }}><Eye size={16} /> Preview</button>
                  <button className={mode === "edit" ? "active" : ""} onClick={() => { setMode("edit"); setExpanded(false); }}><Edit3 size={16} /> Edit site</button>
                </div>
                <Link className="admin-new-link" href="/work/new" onClick={() => setExpanded(false)}><Plus size={17} /> New project</Link>
                {context.isDemo ? (
                  <button className="admin-reset" onClick={async () => {
                    const confirmed = await showConfirm({ title: "Reset demo edits?", message: "This restores the original site content and projects in this browser. Your sticker collection will stay intact.", confirmLabel: "Reset edits", danger: true });
                    if (!confirmed) return;
                    localStorage.removeItem("rashi-studio-site-v1");
                    localStorage.removeItem("rashi-studio-projects-v1");
                    window.location.reload();
                  }}>Reset demo edits</button>
                ) : (
                  <form action="/auth/sign-out" method="post"><button className="admin-reset"><LogOut size={14} /> Sign out</button></form>
                )}
              </motion.div>
            ) : (
              <motion.button
                key="collapsed"
                className={`admin-pill ${mode === "edit" ? "is-editing" : ""}`}
                onClick={() => setExpanded(true)}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                aria-label="Open editing studio"
              >
                <span className="admin-pill-icon">{mode === "edit" ? <Edit3 size={16} /> : <Check size={16} />}</span>
                <span>{mode === "edit" ? "Editing" : "Studio"}</span>
                <span className="admin-pill-dot" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      ) : null}
    </Admin.Provider>
  );
}
