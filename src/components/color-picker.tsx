"use client";

import { Check, ChevronDown, Copy, Minus, Pipette, Plus, X } from "lucide-react";
import { useEffect, useId, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { contrastRatio, getContrastForeground, hexToHsv, hexToRgb, hsvToHex, normalizeHex, parseHex } from "@/lib/color";

const palette = [
  { name: "Paper", value: "#F5F0E6" }, { name: "Lime", value: "#DDF48B" }, { name: "Sky", value: "#AFC8FF" }, { name: "Pink", value: "#F3BAD1" },
  { name: "Coral", value: "#FF805C" }, { name: "Sunshine", value: "#FFCF54" }, { name: "Lilac", value: "#B9A7F9" }, { name: "Ink", value: "#1D2923" },
];

export function ColorPicker({ value, onChange, label }: { value: string; onChange: (color: string) => void; label: string }) {
  const [open, setOpen] = useState(false);
  const [placement, setPlacement] = useState<"up" | "down">("down");
  const [popoverMaxHeight, setPopoverMaxHeight] = useState(560);
  const [dragging, setDragging] = useState(false);
  const [hueDragging, setHueDragging] = useState(false);
  const [hexDraft, setHexDraft] = useState(() => normalizeHex(value));
  const [hexError, setHexError] = useState(false);
  const [copied, setCopied] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const hueRef = useRef<HTMLDivElement>(null);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const popoverId = useId();
  const current = normalizeHex(value);
  const hsv = hexToHsv(current);
  const rgb = hexToRgb(current);
  const foreground = getContrastForeground(current);
  const contrast = contrastRatio(current, foreground);

  useEffect(() => () => { if (copyTimer.current) clearTimeout(copyTimer.current); }, []);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => { if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setOpen(false); };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const updateColor = (color: string) => {
    const next = normalizeHex(color, current);
    setHexDraft(next);
    setHexError(false);
    setCopied(false);
    onChange(next);
  };
  const commitHex = () => {
    const parsed = parseHex(hexDraft);
    if (!parsed) { setHexError(true); return; }
    updateColor(parsed);
  };
  const updateSurface = (event: ReactPointerEvent<HTMLDivElement>) => {
    const bounds = surfaceRef.current?.getBoundingClientRect();
    if (!bounds) return;
    const s = Math.min(1, Math.max(0, (event.clientX - bounds.left) / bounds.width));
    const v = Math.min(1, Math.max(0, 1 - (event.clientY - bounds.top) / bounds.height));
    updateColor(hsvToHex(hsv.h, s, v));
  };
  const updateHue = (hue: number) => {
    updateColor(hsvToHex(Math.min(359.999, Math.max(0, hue)), hsv.s, hsv.v));
  };
  const adjustHue = (amount: number) => updateHue((hsv.h + amount + 360) % 360);
  const updateHueFromPointer = (event: ReactPointerEvent<HTMLDivElement>) => {
    const bounds = hueRef.current?.getBoundingClientRect();
    if (!bounds) return;
    updateHue(Math.min(1, Math.max(0, (event.clientX - bounds.left) / bounds.width)) * 360);
  };
  const close = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };
  const copyHex = async () => {
    try {
      await navigator.clipboard.writeText(current);
      setCopied(true);
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="color-picker" ref={rootRef} data-no-cursor>
      <button ref={triggerRef} type="button" className="color-picker-trigger" onClick={() => {
        setHexDraft(current);
        setHexError(false);
        if (!open) {
          const bounds = triggerRef.current?.getBoundingClientRect();
          if (bounds) {
            const below = window.innerHeight - bounds.top - 48;
            const above = bounds.top - 104;
            const nextPlacement = below >= 480 || below >= above ? "down" : "up";
            const available = nextPlacement === "down" ? below : above;
            setPlacement(nextPlacement);
            setPopoverMaxHeight(Math.max(100, Math.min(560, available, window.innerHeight - 28)));
          }
        }
        setOpen((value) => !value);
      }} aria-label={`${label} colour options`} aria-expanded={open} aria-controls={popoverId}>
        <span className="color-picker-current" style={{ background: current }} /><span>Colour</span><ChevronDown size={11} />
      </button>
      <div className={`color-picker-popover ${placement === "up" ? "is-up" : ""}`} id={popoverId} hidden={!open} role="dialog" aria-label={`${label} colour palette`} style={{ maxHeight: popoverMaxHeight }}>
        <div className="color-picker-heading">
          <span><Pipette size={14} /><span><strong>{label}</strong><small>COLOUR STUDIO</small></span></span>
          <button type="button" onClick={close} aria-label="Close colour picker"><X size={15} /></button>
        </div>

        <div className="color-picker-preview" style={{ "--preview-color": current, "--preview-foreground": foreground } as CSSProperties}>
          <span className="color-picker-preview-letter" aria-hidden="true">Aa</span>
          <span><strong>{current}</strong><small>RGB {rgb.r} · {rgb.g} · {rgb.b}</small></span>
          <button type="button" onClick={() => void copyHex()} aria-label={copied ? "Hex colour copied" : `Copy ${current}`}>{copied ? <Check size={15} /> : <Copy size={14} />}<span>{copied ? "Copied" : "Copy"}</span></button>
        </div>

        <label className={`color-picker-hex ${hexError ? "has-error" : ""}`}><span>HEX</span><input
          value={hexDraft}
          maxLength={7}
          onChange={(event) => {
            const next = event.target.value.toUpperCase();
            setHexDraft(next);
            setHexError(false);
            if (/^#[0-9A-F]{6}$/.test(next)) updateColor(next);
          }}
          onBlur={commitHex}
          onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); commitHex(); } }}
          aria-label={`${label} custom hex colour`}
          aria-invalid={hexError}
          spellCheck={false}
          placeholder="#F5F0E6"
        /><i style={{ background: current }} /></label>
        <div className={`color-picker-input-note ${hexError ? "is-error" : ""}`} aria-live="polite">{hexError ? "Use 3 or 6 hex characters, for example #F5F0E6." : "Enter to apply · shorthand works too"}</div>

        <div className="color-picker-hue-control">
          <div className="color-picker-control-heading"><span>Hue</span><output>{Math.round(hsv.h)}°</output></div>
          <div className="color-picker-hue-row">
            <button type="button" className="color-picker-hue-step" onClick={() => adjustHue(-1)} aria-label={`Decrease ${label} hue by 1 degree`}><Minus size={13} /></button>
            <div
              className="color-picker-hue-slider"
              ref={hueRef}
              role="slider"
              tabIndex={0}
              aria-label={`${label} hue`}
              aria-valuemin={0}
              aria-valuemax={360}
              aria-valuenow={Math.round(hsv.h)}
              aria-valuetext={`${Math.round(hsv.h)} degrees`}
              onPointerDown={(event) => {
                event.currentTarget.focus({ preventScroll: true });
                event.preventDefault();
                event.currentTarget.setPointerCapture(event.pointerId);
                setHueDragging(true);
                updateHueFromPointer(event);
              }}
              onPointerMove={(event) => { if (hueDragging) updateHueFromPointer(event); }}
              onPointerUp={(event) => { setHueDragging(false); if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); }}
              onPointerCancel={() => setHueDragging(false)}
              onKeyDown={(event) => {
                const step = event.shiftKey ? 10 : 1;
                if (event.key === "ArrowLeft" || event.key === "ArrowDown") updateHue(hsv.h - step);
                else if (event.key === "ArrowRight" || event.key === "ArrowUp") updateHue(hsv.h + step);
                else if (event.key === "PageDown") updateHue(hsv.h - 10);
                else if (event.key === "PageUp") updateHue(hsv.h + 10);
                else if (event.key === "Home") updateHue(0);
                else if (event.key === "End") updateHue(359.999);
                else return;
                event.preventDefault();
              }}
            >
              <span className="color-picker-hue-track" aria-hidden="true" />
              <span className="color-picker-hue-marker" style={{ left: `${hsv.h / 360 * 100}%`, background: hsvToHex(hsv.h, 1, 1) }} aria-hidden="true"><span /></span>
            </div>
            <button type="button" className="color-picker-hue-step" onClick={() => adjustHue(1)} aria-label={`Increase ${label} hue by 1 degree`}><Plus size={13} /></button>
          </div>
          <div className="color-picker-hue-scale" aria-hidden="true"><span>0°</span><span>120°</span><span>240°</span><span>360°</span></div>
        </div>


        <div className="color-picker-surface-label"><span>Saturation & brightness</span><small>{Math.round(hsv.s * 100)}% · {Math.round(hsv.v * 100)}%</small></div>
        <div
          className="color-picker-surface"
          ref={surfaceRef}
          onPointerDown={(event) => { event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); setDragging(true); updateSurface(event); }}
          onPointerMove={(event) => { if (dragging) updateSurface(event); }}
          onPointerUp={(event) => { setDragging(false); if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); }}
          onPointerCancel={() => setDragging(false)}
          style={{ background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, ${hsvToHex(hsv.h, 1, 1)})` }}
          role="slider"
          aria-label={`${label} saturation and brightness`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(hsv.s * 100)}
          aria-valuetext={`${Math.round(hsv.s * 100)} percent saturation, ${Math.round(hsv.v * 100)} percent brightness`}
          onKeyDown={(event) => {
            const step = event.shiftKey ? 0.1 : 0.03;
            if (event.key === "ArrowLeft" || event.key === "ArrowRight") updateColor(hsvToHex(hsv.h, Math.min(1, Math.max(0, hsv.s + (event.key === "ArrowRight" ? step : -step))), hsv.v));
            else if (event.key === "ArrowUp" || event.key === "ArrowDown") updateColor(hsvToHex(hsv.h, hsv.s, Math.min(1, Math.max(0, hsv.v + (event.key === "ArrowUp" ? step : -step)))));
            else return;
            event.preventDefault();
          }}
          tabIndex={0}
        >
          <span className="color-picker-surface-marker" style={{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%`, background: current }} />
        </div>

        <div className="color-picker-section-label"><span>Studio palette</span><small>Quick picks</small></div>
        <div className="color-picker-swatches">
          {palette.map((color) => (
            <button key={color.value} type="button" className={current === color.value ? "active" : ""} style={{ "--swatch": color.value, "--swatch-foreground": getContrastForeground(color.value) } as CSSProperties} onClick={() => updateColor(color.value)} aria-label={`${label} ${color.name}`} title={`${color.name} · ${color.value}`} aria-pressed={current === color.value}>
              {current === color.value ? <Check size={13} /> : null}
            </button>
          ))}
        </div>

        <div className="color-picker-footer">
          <span className="color-picker-contrast"><i style={{ background: foreground }} />Auto text: {foreground === "#1D2923" || foreground === "#000000" ? "Ink" : "Paper"} <small>{contrast.toFixed(1)}:1</small></span>
          <button type="button" onClick={close}>Done <Check size={13} /></button>
        </div>
      </div>
    </div>
  );
}
