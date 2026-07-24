/** Cool editorial palette — navy, blue, sage, forest, mint accent */
export const PALETTE = {
  navy: "#2F3D4D",
  slate: "#4D5963",
  steel: "#6D8FA3",
  mist: "#93ACAA",
  sage: "#6E8682",
  forest: "#455A4F",
  mint: "#7AD9BD",
  softMint: "#8FCBAB",
} as const;

export const PAPER_NOISE_DATA_URL =
  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E\")";

export const MOONLIGHT_GRADIENT =
  "radial-gradient(ellipse 75% 60% at 50% 32%, rgba(80,110,130,0.08) 0%, #0D1117 72%)";

export const TEXT_COLORS = {
  quote: "rgba(255,255,255,0.94)",
  quoteFocused: "rgba(255,255,255,0.96)",
  title: "rgba(255,255,255,0.72)",
  titleFocused: "rgba(255,255,255,0.78)",
  type: "rgba(255,255,255,0.44)",
  typeFocused: "rgba(255,255,255,0.48)",
  icon: "rgba(255,255,255,0.74)",
  heading: "rgba(255,255,255,0.94)",
  subtitle: "rgba(255,255,255,0.42)",
} as const;

export type BubbleVisualState =
  | "idle-blind"
  | "idle-featured"
  | "focused"
  | "neighbor"
  | "far-featured"
  | "far-blind";

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const normalized = hex.replace("#", "");

  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  };
}

export function paletteToRgba(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function parseBubbleRgb(
  color: string,
): { r: number; g: number; b: number } {
  const rgbaMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);

  if (rgbaMatch) {
    return {
      r: Number(rgbaMatch[1]),
      g: Number(rgbaMatch[2]),
      b: Number(rgbaMatch[3]),
    };
  }

  if (color.startsWith("#")) {
    return hexToRgb(color);
  }

  return { r: 109, g: 143, b: 163 };
}

function scaleChannel(value: number, factor: number): number {
  return clamp(Math.round(value * factor), 0, 255);
}

function rgbString(r: number, g: number, b: number): string {
  return `rgb(${r}, ${g}, ${b})`;
}

function adjustTone(
  rgb: { r: number; g: number; b: number },
  percent: number,
): string {
  const factor = 1 + percent / 100;

  return rgbString(
    scaleChannel(rgb.r, factor),
    scaleChannel(rgb.g, factor),
    scaleChannel(rgb.b, factor),
  );
}

export function getBubbleBackground(color: string): string {
  const rgb = parseBubbleRgb(color);
  const base = rgbString(rgb.r, rgb.g, rgb.b);

  return `radial-gradient(circle at 30% 30%, ${adjustTone(rgb, 4)}, ${base} 68%, ${adjustTone(rgb, -4)})`;
}

export function getBubbleBorder(state: BubbleVisualState): string {
  switch (state) {
    case "focused":
      return "1px solid rgba(255,255,255,0.28)";
    case "neighbor":
      return "1px solid rgba(255,255,255,0.18)";
    default:
      return "1px solid rgba(255,255,255,0.10)";
  }
}

export function getBubbleGlow(
  color: string,
  state: BubbleVisualState,
): string {
  const { r, g, b } = parseBubbleRgb(color);

  let spread = 22;
  let alpha = 0.08;

  switch (state) {
    case "focused":
      spread = 40;
      alpha = 0.18;
      break;
    case "neighbor":
      spread = 32;
      alpha = 0.15;
      break;
    case "idle-featured":
      spread = 28;
      alpha = 0.12;
      break;
    case "far-featured":
      spread = 24;
      alpha = 0.1;
      break;
    case "idle-blind":
      spread = 18;
      alpha = 0.06;
      break;
    case "far-blind":
      spread = 14;
      alpha = 0.05;
      break;
  }

  const innerHighlight = "inset 0 1px 0 rgba(255,255,255,0.04)";
  const innerShadow = "inset 0 -8px 16px rgba(0,0,0,0.05)";
  const outerGlow = `0 0 ${spread}px rgba(${r}, ${g}, ${b}, ${alpha})`;

  return `${innerHighlight}, ${innerShadow}, ${outerGlow}`;
}

export function getBubbleVisualState(
  alwaysVisible: boolean,
  pointerInside: boolean,
  isPrimary: boolean,
  isNeighbor: boolean,
): BubbleVisualState {
  if (alwaysVisible) {
    if (!pointerInside) {
      return "idle-featured";
    }

    if (isPrimary) {
      return "focused";
    }

    if (isNeighbor) {
      return "neighbor";
    }

    return "far-featured";
  }

  if (!pointerInside) {
    return "idle-blind";
  }

  if (isPrimary) {
    return "focused";
  }

  if (isNeighbor) {
    return "neighbor";
  }

  return "far-blind";
}

export function getModalStyles(color: string): {
  background: string;
  border: string;
  boxShadow: string;
  coverBackground: string;
} {
  const rgb = parseBubbleRgb(color);

  return {
    background: [
      `radial-gradient(circle at 28% 18%, rgba(255,255,255,0.05), transparent 42%)`,
      `radial-gradient(circle at 30% 30%, ${adjustTone(rgb, 4)}, ${rgbString(rgb.r, rgb.g, rgb.b)} 68%, ${adjustTone(rgb, -4)})`,
    ].join(", "),
    border: "1px solid rgba(255,255,255,0.14)",
    boxShadow: `0 0 48px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.18), inset 0 1px 0 rgba(255,255,255,0.05)`,
    coverBackground: paletteToRgba(color.startsWith("#") ? color : PALETTE.steel, 0.22),
  };
}
