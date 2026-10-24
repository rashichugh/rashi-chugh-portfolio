export function parseHex(value: string) {
  const clean = value.trim().replace(/^#?/, "#");
  if (/^#[0-9a-f]{3}$/i.test(clean)) return `#${clean.slice(1).split("").map((character) => character + character).join("")}`.toUpperCase();
  return /^#[0-9a-f]{6}$/i.test(clean) ? clean.toUpperCase() : null;
}

export function normalizeHex(value: string, fallback = "#F5F0E6") {
  return parseHex(value) ?? fallback;
}

export function hexToRgb(hexValue: string) {
  const hex = normalizeHex(hexValue).slice(1);
  const [r, g, b] = [0, 2, 4].map((index) => parseInt(hex.slice(index, index + 2), 16));
  return { r, g, b };
}

export function hexToHsv(hexValue: string) {
  const { r: red, g: green, b: blue } = hexToRgb(hexValue);
  const [r, g, b] = [red, green, blue].map((channel) => channel / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  let h = 0;
  if (delta) {
    if (max === r) h = 60 * (((g - b) / delta) % 6);
    else if (max === g) h = 60 * ((b - r) / delta + 2);
    else h = 60 * ((r - g) / delta + 4);
  }
  return { h: (h + 360) % 360, s: max ? delta / max : 0, v: max };
}

export function hsvToHex(h: number, s: number, v: number) {
  const c = v * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = v - c;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return `#${[r, g, b].map((channel) => Math.round((channel + m) * 255).toString(16).padStart(2, "0")).join("")}`.toUpperCase();
}

function luminance(hexValue: string) {
  const { r, g, b } = hexToRgb(hexValue);
  const channels = [r, g, b].map((channel) => {
    const value = channel / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

export function contrastRatio(first: string, second: string) {
  const a = luminance(normalizeHex(first));
  const b = luminance(normalizeHex(second));
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

export function getContrastForeground(background: string, dark = "#1D2923", light = "#F5F0E6") {
  const accent = normalizeHex(background);
  const preferred = contrastRatio(accent, light) > contrastRatio(accent, dark) ? light : dark;
  if (contrastRatio(accent, preferred) >= 4.5) return preferred;
  return contrastRatio(accent, "#FFFFFF") > contrastRatio(accent, "#000000") ? "#FFFFFF" : "#000000";
}
