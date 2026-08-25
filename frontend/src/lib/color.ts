/**
 * Colour maths for the admin-chosen brand palette.
 *
 * You pick one brand colour in Site settings. A colour chosen to look right on a
 * white page is usually too dark to read on a near-black one, so the dark theme
 * gets an automatically lightened variant rather than a second admin field.
 */

const HEX = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

export function parseHex(value: string): Rgb | null {
  const match = HEX.exec(value.trim());
  if (!match) return null;
  let hex = match[1] ?? "";
  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((c) => c + c)
      .join("");
  }
  return {
    r: parseInt(hex.slice(0, 2), 16),
    g: parseInt(hex.slice(2, 4), 16),
    b: parseInt(hex.slice(4, 6), 16),
  };
}

export function toHex({ r, g, b }: Rgb): string {
  const part = (n: number) =>
    Math.max(0, Math.min(255, Math.round(n)))
      .toString(16)
      .padStart(2, "0");
  return `#${part(r)}${part(g)}${part(b)}`;
}

function channelLuminance(value: number): number {
  const c = value / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

export function relativeLuminance({ r, g, b }: Rgb): number {
  return 0.2126 * channelLuminance(r) + 0.7152 * channelLuminance(g) + 0.0722 * channelLuminance(b);
}

/** WCAG contrast ratio between two colours, 1 (identical) to 21 (black on white). */
export function contrastRatio(a: Rgb, b: Rgb): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}

function rgbToHsl({ r, g, b }: Rgb): [number, number, number] {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === rn) h = (gn - bn) / d + (gn < bn ? 6 : 0);
  else if (max === gn) h = (bn - rn) / d + 2;
  else h = (rn - gn) / d + 4;
  return [h / 6, s, l];
}

function hslToRgb(h: number, s: number, l: number): Rgb {
  if (s === 0) {
    const v = l * 255;
    return { r: v, g: v, b: v };
  }
  const hue = (t: number): number => {
    let temp = t;
    if (temp < 0) temp += 1;
    if (temp > 1) temp -= 1;
    if (temp < 1 / 6) return p + (q - p) * 6 * temp;
    if (temp < 1 / 2) return q;
    if (temp < 2 / 3) return p + (q - p) * (2 / 3 - temp) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return { r: hue(h + 1 / 3) * 255, g: hue(h) * 255, b: hue(h - 1 / 3) * 255 };
}

/**
 * Lighten `colour` just far enough to reach `minRatio` against `background`,
 * keeping its hue and saturation so it still reads as the same brand colour.
 * Returns the original if it already passes.
 */
export function ensureContrast(colour: string, background: string, minRatio = 4.5): string {
  const fg = parseHex(colour);
  const bg = parseHex(background);
  if (!fg || !bg) return colour;
  if (contrastRatio(fg, bg) >= minRatio) return colour;

  const [h, s, startL] = rgbToHsl(fg);
  const backgroundIsDark = relativeLuminance(bg) < 0.5;

  for (let step = 1; step <= 100; step++) {
    const l = backgroundIsDark
      ? Math.min(1, startL + step * 0.01)
      : Math.max(0, startL - step * 0.01);
    const candidate = hslToRgb(h, s, l);
    if (contrastRatio(candidate, bg) >= minRatio) return toHex(candidate);
    if (l === 0 || l === 1) break;
  }
  // Nothing in this hue reaches the target; fall back to plain black or white.
  return backgroundIsDark ? "#ffffff" : "#000000";
}

/**
 * Black or white, whichever is more readable on `background`.
 *
 * Used for text sitting *on* a brand-filled button, where the brand colour is
 * the background rather than the text.
 */
export function bestForeground(background: string, light = "#ffffff", dark = "#0b0f15"): string {
  const bg = parseHex(background);
  const lightFg = parseHex(light);
  const darkFg = parseHex(dark);
  if (!bg || !lightFg || !darkFg) return light;
  return contrastRatio(lightFg, bg) >= contrastRatio(darkFg, bg) ? light : dark;
}
