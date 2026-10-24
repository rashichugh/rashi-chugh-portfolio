"use client";

import { AlertCircle, Check, LoaderCircle, Save } from "lucide-react";

export type SaveState = "idle" | "unsaved" | "saving" | "saved" | "error";

export function SaveIndicator({ state, onSave }: { state: SaveState; onSave: () => void }) {
  return (
    <div className={`save-indicator save-${state}`} data-no-cursor>
      <span>
        {state === "saving" ? <LoaderCircle className="spin" size={15} /> : state === "saved" ? <Check size={15} /> : state === "error" ? <AlertCircle size={15} /> : <span className="save-dot" />}
        {state === "saving" ? "Saving…" : state === "saved" ? "All changes saved" : state === "error" ? "Couldn’t save" : state === "unsaved" ? "Unsaved changes" : "Inline editing is on"}
      </span>
      <button onClick={onSave} disabled={state === "saving"}><Save size={14} /> Save now</button>
    </div>
  );
}
