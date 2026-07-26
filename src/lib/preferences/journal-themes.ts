/**
 * Journey Palette — visual atmospheres for the Journal.
 * Future DB field: user_settings.journalTheme
 */

import type { CSSProperties } from "react";

import type { JournalThemeId } from "@/types/preferences";

export type { JournalThemeId };

export type JournalThemePalette = {
  id: JournalThemeId;
  label: string;
  description: string;
  /** Soft preview swatches for the picker */
  swatches: [string, string, string, string] | [string, string, string];
  /** CSS custom property values (rgba / hex) */
  vars: {
    accent: string;
    accentSoft: string;
    accentBorder: string;
    accentBg: string;
    accentText: string;
    accentRing: string;
    lineFrom: string;
    glow: string;
    activity1: string;
    activity2: string;
    activity3: string;
    activityExtra: string;
  };
};

export const DEFAULT_JOURNAL_THEME: JournalThemeId = "morandi";

export const JOURNAL_THEME_PALETTES: Record<
  JournalThemeId,
  JournalThemePalette
> = {
  morandi: {
    id: "morandi",
    label: "Morandi",
    description: "Quiet editorial feeling",
    swatches: ["#8FA396", "#8CA0B0", "#9B93A8", "#9A9A96"],
    vars: {
      accent: "rgba(143,163,150,0.72)",
      accentSoft: "rgba(143,163,150,0.18)",
      accentBorder: "rgba(143,163,150,0.28)",
      accentBg: "rgba(143,163,150,0.1)",
      accentText: "rgba(214,224,216,0.9)",
      accentRing: "rgba(143,163,150,0.28)",
      lineFrom: "rgba(140,160,176,0.28)",
      glow: "rgba(140,160,176,0.08)",
      activity1: "rgba(143,163,150,0.55)",
      activity2: "rgba(140,160,176,0.5)",
      activity3: "rgba(155,147,168,0.5)",
      activityExtra: "rgba(154,154,150,0.45)",
    },
  },
  macaron: {
    id: "macaron",
    label: "Macaron",
    description: "Soft playful feeling",
    swatches: ["#9ED9C5", "#A8C8E8", "#E8B4C8", "#E8DFD0"],
    vars: {
      accent: "rgba(158,217,197,0.7)",
      accentSoft: "rgba(158,217,197,0.18)",
      accentBorder: "rgba(168,200,232,0.3)",
      accentBg: "rgba(158,217,197,0.1)",
      accentText: "rgba(220,245,235,0.92)",
      accentRing: "rgba(168,200,232,0.3)",
      lineFrom: "rgba(232,180,200,0.28)",
      glow: "rgba(168,200,232,0.1)",
      activity1: "rgba(158,217,197,0.55)",
      activity2: "rgba(168,200,232,0.52)",
      activity3: "rgba(232,180,200,0.5)",
      activityExtra: "rgba(232,223,208,0.42)",
    },
  },
  dopamine: {
    id: "dopamine",
    label: "Dopamine",
    description: "Energetic feeling",
    swatches: ["#4F8CFF", "#3DC9D9", "#3DBF7A", "#8B6CFF"],
    vars: {
      accent: "rgba(79,140,255,0.72)",
      accentSoft: "rgba(79,140,255,0.18)",
      accentBorder: "rgba(61,201,217,0.32)",
      accentBg: "rgba(79,140,255,0.1)",
      accentText: "rgba(210,228,255,0.92)",
      accentRing: "rgba(139,108,255,0.3)",
      lineFrom: "rgba(61,201,217,0.32)",
      glow: "rgba(79,140,255,0.1)",
      activity1: "rgba(79,140,255,0.55)",
      activity2: "rgba(61,201,217,0.5)",
      activity3: "rgba(61,191,122,0.48)",
      activityExtra: "rgba(139,108,255,0.5)",
    },
  },
  midnight: {
    id: "midnight",
    label: "Midnight",
    description: "Cinematic night feeling",
    swatches: ["#2A3F6B", "#8EB6D9", "#6E628A"],
    vars: {
      accent: "rgba(142,182,217,0.7)",
      accentSoft: "rgba(142,182,217,0.16)",
      accentBorder: "rgba(142,182,217,0.28)",
      accentBg: "rgba(42,63,107,0.35)",
      accentText: "rgba(210,228,242,0.9)",
      accentRing: "rgba(110,98,138,0.35)",
      lineFrom: "rgba(142,182,217,0.3)",
      glow: "rgba(42,63,107,0.2)",
      activity1: "rgba(142,182,217,0.55)",
      activity2: "rgba(110,98,138,0.5)",
      activity3: "rgba(74,96,140,0.55)",
      activityExtra: "rgba(170,190,220,0.42)",
    },
  },
  forest: {
    id: "forest",
    label: "Forest",
    description: "Natural feeling",
    swatches: ["#6B8F71", "#8A8F5C", "#8B7355"],
    vars: {
      accent: "rgba(107,143,113,0.72)",
      accentSoft: "rgba(107,143,113,0.18)",
      accentBorder: "rgba(138,143,92,0.3)",
      accentBg: "rgba(107,143,113,0.1)",
      accentText: "rgba(214,228,210,0.9)",
      accentRing: "rgba(107,143,113,0.28)",
      lineFrom: "rgba(138,143,92,0.28)",
      glow: "rgba(139,115,85,0.1)",
      activity1: "rgba(107,143,113,0.55)",
      activity2: "rgba(138,143,92,0.5)",
      activity3: "rgba(139,115,85,0.48)",
      activityExtra: "rgba(120,140,110,0.42)",
    },
  },
};

export const JOURNAL_THEME_OPTIONS = (
  Object.keys(JOURNAL_THEME_PALETTES) as JournalThemeId[]
).map((id) => JOURNAL_THEME_PALETTES[id]);

export function isJournalThemeId(value: unknown): value is JournalThemeId {
  return (
    typeof value === "string" &&
    Object.prototype.hasOwnProperty.call(JOURNAL_THEME_PALETTES, value)
  );
}

export function getJournalThemePalette(
  id: JournalThemeId = DEFAULT_JOURNAL_THEME,
): JournalThemePalette {
  return JOURNAL_THEME_PALETTES[id] ?? JOURNAL_THEME_PALETTES[DEFAULT_JOURNAL_THEME];
}

/** Inline style object for a Journal theme scope. */
export function journalThemeStyle(id: JournalThemeId): CSSProperties {
  const { vars } = getJournalThemePalette(id);

  return {
    ["--journal-accent" as string]: vars.accent,
    ["--journal-accent-soft" as string]: vars.accentSoft,
    ["--journal-accent-border" as string]: vars.accentBorder,
    ["--journal-accent-bg" as string]: vars.accentBg,
    ["--journal-accent-text" as string]: vars.accentText,
    ["--journal-accent-ring" as string]: vars.accentRing,
    ["--journal-line-from" as string]: vars.lineFrom,
    ["--journal-glow" as string]: vars.glow,
    ["--journal-activity-1" as string]: vars.activity1,
    ["--journal-activity-2" as string]: vars.activity2,
    ["--journal-activity-3" as string]: vars.activity3,
    ["--journal-activity-extra" as string]: vars.activityExtra,
  } as CSSProperties;
}
