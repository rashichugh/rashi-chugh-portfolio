"use client";

import { ImagePlus, Link2, LoaderCircle, Upload, X } from "lucide-react";
import { useState } from "react";
import { uploadMedia } from "@/lib/demo-store";

export function MediaField({
  value,
  onChange,
  isDemo,
  accept = "image/*",
  label = "Media",
  compact = false,
}: {
  value: string;
  onChange: (value: string) => void;
  isDemo: boolean;
  accept?: string;
  label?: string;
  compact?: boolean;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function upload(file?: File) {
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      onChange(await uploadMedia(file, isDemo));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className={`media-field ${compact ? "compact" : ""}`} data-no-cursor>
      <div className="field-label-row"><label>{label}</label>{value ? <button type="button" onClick={() => onChange("")}><X size={13} /> Clear</button> : null}</div>
      {value && accept.includes("image") ? <div className="media-field-preview"><img src={value} alt="Selected media preview" /></div> : null}
      <div className="media-field-input">
        <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={accept.includes("video") ? "Video URL, MP4, YouTube or Vimeo" : "Paste an image URL (https://…)"} aria-label={`${label} URL`} />
        <label className={`upload-button ${uploading ? "disabled" : ""}`}>
          {uploading ? <LoaderCircle className="spin" size={15} /> : accept.includes("image") ? <ImagePlus size={15} /> : <Upload size={15} />}
          {uploading ? "Uploading" : "Upload"}
          <input type="file" accept={accept} disabled={uploading} onChange={(event) => { void upload(event.target.files?.[0]); event.target.value = ""; }} />
        </label>
      </div>
      <p className="media-field-help"><Link2 size={12} /> Paste a direct link above, or use Upload.</p>
      {error ? <p className="field-error">{error}</p> : null}
    </div>
  );
}
