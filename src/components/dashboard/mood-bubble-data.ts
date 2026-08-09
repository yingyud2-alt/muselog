/**
 * Mood Bubble visual configuration + slot plan.
 *
 * Content (title / creator / teaser / workId) is injected from the
 * canonical API recommendation layer — never hardcoded mock titles.
 */

export type MediaType = "BOOK" | "MOVIE" | "MUSIC" | "PODCAST" | "TV";

export type BubbleMood =
  | "melancholic"
  | "warm"
  | "reflective"
  | "nostalgic"
  | "curious"
  | "quiet";

export type WorkBubble = {
  /** Visual slot id — keys layout / color / size maps. */
  id: number;
  type: MediaType;
  /** Canonical / original provider title (never overwritten by locale). */
  title: string;
  /** Canonical / original provider creator. */
  creator: string;
  /** Concise original teaser line (not a sourced quotation). */
  quote: string;
  /** Optional Chinese presentation layer — does not mutate Work identity. */
  localizedTitle?: string;
  localizedCreator?: string;
  localizedQuote?: string;
  color: string;
  baseSize: number;
  alwaysVisible: boolean;
  tags?: string[];
  mood?: BubbleMood;
  /** Canonical API Work id (ol- / tmdb- / lastfm-). */
  workId?: string;
  coverUrl?: string;
  source?: string;
  externalId?: string;
};

export type BubbleVisualSlot = {
  id: number;
  alwaysVisible: boolean;
};

/**
 * Featured — flat editorial mint + blue paper cards
 * BOOK: soft blue / mist · MOVIE: steel blue / sage · MUSIC: mint / mist green
 */
const FEATURED_COLOR_BY_ID: Record<number, string> = {
  1: "#7FA8C4",
  2: "#6D8FA3",
  3: "#7AD9BD",
  4: "#8FCBAB",
  5: "#6E8682",
  7: "#6D8FA3",
  8: "#7AD9BD",
};

/**
 * Small atmosphere cards — mint + blue dominant, sage supporting
 */
const BLIND_COLOR_WEIGHTS = [
  { color: "#7AD9BD", weight: 22 },
  { color: "#8FCBAB", weight: 18 },
  { color: "#7FA8C4", weight: 22 },
  { color: "#6D8FA3", weight: 22 },
  { color: "#6E8682", weight: 16 },
] as const;

const ALWAYS_VISIBLE_SIZE_BY_ID: Record<number, number> = {
  1: 168,
  2: 198,
  3: 192,
  4: 154,
  5: 172,
  7: 176,
  8: 150,
};

/** Primary recommendation slots — ids 1–8 (featured geometry unchanged). */
const PRIMARY_SLOT_IDS = [1, 2, 3, 4, 5, 6, 7, 8] as const;

/** Featured (alwaysVisible) slot ids — matches prior editorial layout. */
const FEATURED_SLOT_IDS = new Set([1, 2, 3, 4, 5, 7, 8]);

const EXTRA_WORK_COUNT = 92;

function hashSeed(value: number): number {
  let seed = value * 2654435761;
  seed ^= seed << 13;
  seed ^= seed >> 17;
  seed ^= seed << 5;
  return Math.abs(seed);
}

function pickBlindBoxColor(id: number): string {
  const seed = hashSeed(id * 61);
  const roll = seed % 100;
  let cumulative = 0;

  for (const entry of BLIND_COLOR_WEIGHTS) {
    cumulative += entry.weight;
    if (roll < cumulative) return entry.color;
  }

  return "#7AD9BD";
}

function pickFeaturedColor(workId: number): string {
  return FEATURED_COLOR_BY_ID[workId] ?? "#7AD9BD";
}

function blindBoxSizeFromSeed(seed: number): number {
  const tier = seed % 100;
  if (tier < 40) return 14 + (seed % 11);
  if (tier < 65) return 26 + (seed % 17);
  if (tier < 88) return 44 + (seed % 29);
  return 76 + (seed % 23);
}

function baseSizeForSlot(slot: BubbleVisualSlot): number {
  const seed = hashSeed(slot.id);
  if (slot.alwaysVisible) {
    return ALWAYS_VISIBLE_SIZE_BY_ID[slot.id] ?? 132;
  }
  if (slot.id === 6) return 78;
  return blindBoxSizeFromSeed(seed);
}

function colorForSlot(slot: BubbleVisualSlot): string {
  return slot.alwaysVisible
    ? pickFeaturedColor(slot.id)
    : pickBlindBoxColor(slot.id);
}

/** Visual slot plan for a container width (content-agnostic). */
export function getBubbleSlotPlan(width: number): BubbleVisualSlot[] {
  const primary: BubbleVisualSlot[] = PRIMARY_SLOT_IDS.map((id) => ({
    id,
    alwaysVisible: FEATURED_SLOT_IDS.has(id),
  }));

  let extraCount = EXTRA_WORK_COUNT;
  if (width < 480) extraCount = 55;
  else if (width < 768) extraCount = 72;

  const extras: BubbleVisualSlot[] = Array.from(
    { length: extraCount },
    (_, index) => ({
      id: index + 9,
      alwaysVisible: false,
    }),
  );

  return [...primary, ...extras];
}

export type BubbleContentFields = {
  type: MediaType;
  title: string;
  creator: string;
  quote: string;
  localizedTitle?: string;
  localizedCreator?: string;
  localizedQuote?: string;
  tags?: string[];
  mood?: BubbleMood;
  workId?: string;
  coverUrl?: string;
  source?: string;
  externalId?: string;
};

/** Attach content onto a fixed visual slot without changing geometry config. */
export function buildBubbleVisualShell(
  slot: BubbleVisualSlot,
  content: BubbleContentFields,
): WorkBubble {
  return {
    id: slot.id,
    alwaysVisible: slot.alwaysVisible,
    color: colorForSlot(slot),
    baseSize: baseSizeForSlot(slot),
    type: content.type,
    title: content.title,
    creator: content.creator,
    quote: content.quote,
    localizedTitle: content.localizedTitle,
    localizedCreator: content.localizedCreator,
    localizedQuote: content.localizedQuote,
    tags: content.tags,
    mood: content.mood,
    workId: content.workId,
    coverUrl: content.coverUrl,
    source: content.source,
    externalId: content.externalId,
  };
}

/**
 * @deprecated Live homepage uses mapWorksToMoodBubbles + useMoodBubbles.
 * Kept empty so accidental imports never surface mock titles.
 */
export const WORK_BUBBLES: WorkBubble[] = [];

/** Responsive bubble count helper — prefer mapWorksToMoodBubbles for live UI. */
export function getWorkBubblesForContainer(width: number): WorkBubble[] {
  return getBubbleSlotPlan(width).map((slot) =>
    buildBubbleVisualShell(slot, {
      type: "BOOK",
      title: "",
      creator: "",
      quote: "",
    }),
  );
}

export const ALWAYS_VISIBLE_COUNT = FEATURED_SLOT_IDS.size;
export const TOTAL_BUBBLE_COUNT = PRIMARY_SLOT_IDS.length + EXTRA_WORK_COUNT;
