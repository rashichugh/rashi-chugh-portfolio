"use client";

import { useEffect, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  BookOpen, Box, Brush, Camera, Check, ChevronDown, Clapperboard, Eye, Film, Frame,
  Globe, Heart, Image, Layers, Lightbulb, Megaphone, MessageCircle, Monitor,
  MousePointer2, Music, Package, Palette, PenTool, Pencil, Play, Rocket, Scissors,
  Search, Shapes, Smartphone, Sparkles, Star, Target, Type, Video, WandSparkles, X, Zap,
} from "lucide-react";

export const serviceIcons = {
  Palette, PenTool, Shapes, Layers, Type, Image, Sparkles, WandSparkles,
  Clapperboard, Video, Film, Play, Megaphone, Camera, Heart, Star,
  Lightbulb, Pencil, Brush, Scissors, Monitor, Smartphone, Frame, Box,
  Zap, Music, MousePointer2, Rocket, Target, Eye, MessageCircle, BookOpen,
  Globe, Package,
} satisfies Record<string, LucideIcon>;

const iconEntries = Object.entries(serviceIcons) as [string, LucideIcon][];
const labelFor = (name: string) => name.replace(/([a-z])([A-Z])/g, "$1 $2");

export const legacyServiceIcons: Record<string, string> = {
  "✦": "PenTool",
  "◆": "Shapes",
  "▶": "Clapperboard",
  "●": "Megaphone",
};

export function ServiceIcon({ name, size = 30 }: { name?: string; size?: number }) {
  const Icon = (name && serviceIcons[name as keyof typeof serviceIcons]) || Sparkles;
  return <Icon size={size} strokeWidth={1.8} aria-hidden="true" />;
}

export function IconPicker({ value, onChange, label }: { value: string; onChange: (name: string) => void; label: string }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const root = useRef<HTMLDivElement>(null);
  const filtered = iconEntries.filter(([name]) => labelFor(name).toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  return (
    <div className="icon-picker" ref={root} onKeyDown={(event) => { if (event.key === "Escape") setOpen(false); }}>
      <button
        type="button"
        className="service-icon-button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-label={`Choose an icon for ${label}`}
        data-no-cursor
      >
        <ServiceIcon name={value} />
        <ChevronDown size={13} className="icon-picker-chevron" />
      </button>
      {open ? (
        <div className="icon-picker-popover" role="dialog" aria-label={`Lucide icon selector for ${label}`} data-no-cursor>
          <div className="icon-picker-title"><strong>Choose a Lucide icon</strong><button type="button" onClick={() => setOpen(false)} aria-label="Close icon selector"><X size={15} /></button></div>
          <label className="icon-picker-search"><Search size={15} /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search icons…" aria-label="Search Lucide icons" /></label>
          <div className="icon-picker-grid">
            {filtered.map(([name, Icon]) => (
              <button
                type="button"
                key={name}
                className={name === value ? "active" : ""}
                onClick={() => { onChange(name); setOpen(false); setQuery(""); }}
                title={labelFor(name)}
                aria-label={labelFor(name)}
                aria-pressed={name === value}
              >
                <Icon size={21} strokeWidth={1.7} />
                {name === value ? <Check size={11} /> : null}
              </button>
            ))}
          </div>
          {filtered.length === 0 ? <p className="icon-picker-empty">No matching icons.</p> : null}
          <p className="icon-picker-count">{filtered.length} design-friendly Lucide icons</p>
        </div>
      ) : null}
    </div>
  );
}
