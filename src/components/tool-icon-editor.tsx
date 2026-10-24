"use client";

import { useRef, useState } from "react";
import { LoaderCircle, Upload } from "lucide-react";
import { ToolIcon } from "@/components/tool-icon";
import { useDialog } from "@/components/dialog";
import { uploadToolSvg } from "@/lib/demo-store";

export function ToolIconEditor({ name, icon, isDemo, onChange, size = 44 }: { name: string; icon: string; isDemo: boolean; onChange: (icon: string) => void; size?: number }) {
  const { showAlert } = useDialog();
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  return (
    <span className="tool-icon-editor" data-no-cursor>
      <button type="button" className="tool-icon-edit" onClick={() => input.current?.click()} aria-label={`Upload SVG icon for ${name || "new tool"}`} title="Upload an SVG icon">
        <ToolIcon name={name} icon={icon} size={size} />
        <span className="tool-icon-edit-badge" aria-hidden="true">{uploading ? <LoaderCircle className="spin" size={10} /> : <Upload size={10} />}</span>
      </button>
      <input
        ref={input}
        className="tool-svg-input"
        type="file"
        accept="image/svg+xml,.svg"
        disabled={uploading}
        onChange={async (event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (!file) return;
          setUploading(true);
          try {
            onChange(await uploadToolSvg(file, isDemo));
          } catch (error) {
            await showAlert({ title: "SVG upload failed", message: error instanceof Error ? error.message : "Could not upload SVG", danger: true });
          } finally {
            setUploading(false);
          }
        }}
      />
    </span>
  );
}
