"use client";

import type { CSSProperties, ElementType, KeyboardEvent } from "react";
import { cn } from "@/lib/utils";

export function InlineText({
  as: Tag = "span",
  value,
  onChange,
  editing,
  className,
  multiline = false,
  label,
  style,
}: {
  as?: ElementType;
  value: string;
  onChange: (value: string) => void;
  editing: boolean;
  className?: string;
  multiline?: boolean;
  label?: string;
  style?: CSSProperties;
}) {
  if (!editing) return <Tag className={className} style={style}>{value}</Tag>;
  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Enter" && !multiline) {
      event.preventDefault();
      event.currentTarget.blur();
    }
    if (event.key === "Escape") {
      event.currentTarget.textContent = value;
      event.currentTarget.blur();
    }
  };
  return (
    <Tag
      className={cn(className, "inline-editable")}
      style={style}
      contentEditable
      suppressContentEditableWarning
      role="textbox"
      aria-label={label ?? "Edit text"}
      aria-multiline={multiline}
      data-no-cursor
      onKeyDown={onKeyDown}
      onPaste={(event: React.ClipboardEvent<HTMLElement>) => {
        event.preventDefault();
        document.execCommand("insertText", false, event.clipboardData.getData("text/plain"));
      }}
      onBlur={(event: React.FocusEvent<HTMLElement>) => {
        const next = multiline ? event.currentTarget.innerText : event.currentTarget.textContent ?? "";
        if (next.trim() !== value) onChange(next.trim());
      }}
    >
      {value}
    </Tag>
  );
}
