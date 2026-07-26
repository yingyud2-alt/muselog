/** Soft editorial paper cards — mint + blue memories on dark archive */
export const PALETTE = {
  mint: "#7AD9BD",
  softMint: "#8FCBAB",
  mistGreen: "#8FCBAB",
  steelBlue: "#6D8FA3",
  softBlue: "#7FA8C4",
  sage: "#6E8682",
  /** Aliases used by modal/cover fallbacks */
  aqua: "#7AD9BD",
  dustyBlue: "#6D8FA3",
  deepBlue: "#6D8FA3",
  steel: "#7FA8C4",
  ocean: "#6D8FA3",
  sky: "#7FA8C4",
  teal: "#7AD9BD",
  forest: "#6E8682",
  mist: "#8FCBAB",
  slate: "#6D8FA3",
  navy: "#6D8FA3",
  grayBlue: "#6D8FA3",
  lavenderGray: "#6E8682",
} as const;

export const PAPER_NOISE_DATA_URL =
  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E\")";

/** Printed paper grain — quiet magazine fiber, not glass reflection */
export const PAPER_NOISE_OPACITY = 0.05;

/** Quiet archive atmosphere on #090A0F — no neon, no purple */
export const MOONLIGHT_GRADIENT =
  "radial-gradient(ellipse 78% 60% at 50% 34%, rgba(109,143,163,0.07) 0%, rgba(122,217,189,0.04) 38%, #090A0F 78%)";

/** Near-white, slightly warm — not pure bright white */
export const TEXT_COLORS = {
  quote: "rgba(250,248,244,0.92)",
  quoteFocused: "rgba(250,248,244,0.95)",
  title: "rgba(250,248,244,0.72)",
  titleFocused: "rgba(250,248,244,0.8)",
  type: "rgba(250,248,244,0.48)",
  typeFocused: "rgba(250,248,244,0.54)",
  icon: "rgba(250,248,244,0.78)",
  heading: "rgba(250,248,244,0.92)",
  subtitle: "rgba(250,248,244,0.4)",
} as const;

export const BUBBLE_TEXT_COLORS = {
  quote: "rgba(250,248,244,0.94)",
  quoteFocused: "rgba(250,248,244,0.96)",
  title: "rgba(250,248,244,0.68)",
  titleFocused: "rgba(250,248,244,0.76)",
  type: "rgba(250,248,244,0.42)",
  subtitle: "rgba(250,248,244,0.38)",
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

  return hexToRgb(PALETTE.steel);
}

function scaleChannel(value: number, factor: number): number {
  return clamp(Math.round(value * factor), 0, 255);
}

function rgbString(r: number, g: number, b: number): string {
  return `rgb(${r}, ${g}, ${b})`;
}

function rgbaString(r: number, g: number, b: number, a: number): string {
  return `rgba(${r}, ${g}, ${b}, ${a})`;
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

/**
 * Flat editorial paper wash — visible color, slight transparency.
 * No spherical highlights or glossy glass gradients.
 */
export function getBubbleBackground(color: string): string {
  const rgb = parseBubbleRgb(color);

  return `linear-gradient(165deg, ${rgbaString(rgb.r, rgb.g, rgb.b, 0.9)} 0%, ${rgbaString(rgb.r, rgb.g, rgb.b, 0.78)} 100%)`;
}

export function getBubbleBorder(state: BubbleVisualState): string {
  switch (state) {
    case "focused":
      return "1px solid rgba(250,248,244,0.18)";
    case "neighbor":
      return "1px solid rgba(250,248,244,0.12)";
    default:
      return "1px solid rgba(250,248,244,0.08)";
  }
}

/**
 * Soft ambient lift shadow — floating paper, not glowing glass.
 * Color argument kept for call-site compatibility; unused on purpose.
 */
export function getBubbleGlow(
  _color: string,
  state: BubbleVisualState,
): string {
  let y = 10;
  let blur = 28;
  let alpha = 0.18;

  switch (state) {
    case "focused":
      y = 14;
      blur = 36;
      alpha = 0.24;
      break;
    case "neighbor":
      y = 12;
      blur = 32;
      alpha = 0.2;
      break;
    case "idle-featured":
      y = 10;
      blur = 30;
      alpha = 0.2;
      break;
    case "far-featured":
      y = 8;
      blur = 26;
      alpha = 0.16;
      break;
    case "idle-blind":
      y = 6;
      blur = 20;
      alpha = 0.14;
      break;
    case "far-blind":
      y = 5;
      blur = 16;
      alpha = 0.12;
      break;
  }

  return `0 ${y}px ${blur}px rgba(0,0,0,${alpha}), 0 2px 6px rgba(0,0,0,${alpha * 0.55})`;
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
    background: `linear-gradient(165deg, ${adjustTone(rgb, 4)} 0%, ${rgbaString(rgb.r, rgb.g, rgb.b, 0.88)} 100%)`,
    border: "1px solid rgba(250,248,244,0.12)",
    boxShadow: `0 18px 48px rgba(0,0,0,0.32), 0 4px 12px rgba(0,0,0,0.18)`,
    coverBackground: paletteToRgba(
      color.startsWith("#") ? color : PALETTE.steel,
      0.32,
    ),
  };
}
