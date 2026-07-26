import type { JourneyColor, MediaItem, MediaType } from "@/types/media";
import {
  JOURNEY_COLOR_STYLES,
  TYPE_JOURNEY_COLORS,
} from "@/types/media";

const DATE_STRING_RE = /^\d{4}-\d{2}-\d{2}$/;

const LEGACY_JOURNEY_COLORS: Record<string, JourneyColor> = {
  cyan: "ocean",
  amber: "beige",
  olive: "sage",
  blue: "ocean",
  "warm-gray": "beige",
};

export function isValidDateString(value?: string | null): value is string {
  if (!value || !DATE_STRING_RE.test(value)) return false;

  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));

  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
}

export function normalizeJourneyColor(
  color: unknown,
  fallback: JourneyColor,
): JourneyColor {
  if (typeof color === "string" && color in JOURNEY_COLOR_STYLES) {
    return color as JourneyColor;
  }

  if (typeof color === "string" && color in LEGACY_JOURNEY_COLORS) {
    return LEGACY_JOURNEY_COLORS[color];
  }

  return fallback;
}

export function sanitizeMediaItem(
  raw: Partial<MediaItem> & { id?: string },
): MediaItem | null {
  if (!raw.id || !raw.title || !raw.type) return null;

  const type = raw.type as MediaType;
  if (!(type in TYPE_JOURNEY_COLORS)) return null;

  const fallbackDate =
    (isValidDateString(raw.date) && raw.date) ||
    (isValidDateString(raw.startDate) && raw.startDate) ||
    null;

  if (!fallbackDate) return null;

  const start = isValidDateString(raw.startDate) ? raw.startDate : fallbackDate;
  let end = isValidDateString(raw.endDate) ? raw.endDate : start;

  if (end < start) {
    end = start;
  }

  const fallbackColor = TYPE_JOURNEY_COLORS[type];

  return {
    id: raw.id,
    type,
    title: raw.title,
    cover: raw.cover ?? "",
    creator: raw.creator ?? "",
    rating: typeof raw.rating === "number" ? raw.rating : 0,
    status: raw.status ?? "READING",
    date: fallbackDate,
    quote: raw.quote ?? "",
    note: raw.note ?? raw.notes ?? "",
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    duration:
      typeof raw.durationMinutes === "number"
        ? raw.durationMinutes
        : raw.duration,
    durationMinutes:
      typeof raw.durationMinutes === "number"
        ? raw.durationMinutes
        : typeof raw.duration === "number"
          ? raw.duration
          : undefined,
    memories: Array.isArray(raw.memories) ? raw.memories : [],
    startDate: start,
    endDate: end !== start ? end : undefined,
    journeyColor: normalizeJourneyColor(
      raw.journeyColor ?? raw.color,
      fallbackColor,
    ),
    color: normalizeJourneyColor(raw.journeyColor ?? raw.color, fallbackColor),
    moment: raw.moment,
  };
}

export function filterJourneyItems(items: MediaItem[]): MediaItem[] {
  return items.filter((item) => {
    const start = getJourneyStart(item);
    const end = getJourneyEnd(item);
    return isValidDateString(start) && isValidDateString(end) && start <= end;
  });
}

export function getJourneyStart(item: MediaItem): string {
  const start = item.startDate ?? item.date;
  return isValidDateString(start) ? start : item.date;
}

export function getJourneyEnd(item: MediaItem): string {
  if (item.endDate && isValidDateString(item.endDate)) return item.endDate;
  return getJourneyStart(item);
}

export function dateHasJournalMedia(date: string, items: MediaItem[]): boolean {
  return items.some((item) => {
    const start = getJourneyStart(item);
    const end = getJourneyEnd(item);
    return date >= start && date <= end;
  });
}

export function getJourneyColor(item: MediaItem): JourneyColor {
  return normalizeJourneyColor(
    item.journeyColor ?? item.color,
    TYPE_JOURNEY_COLORS[item.type],
  );
}

/** Marker dot on key touchpoints only — not every day in range. */
export function dayHasMediaMarker(date: string, items: MediaItem[]): boolean {
  return items.some((item) => {
    const start = getJourneyStart(item);
    const end = getJourneyEnd(item);

    return date === item.date || date === start || date === end;
  });
}

export function formatJourneyDay(date: string): string {
  const [, month, day] = date.split("-").map(Number);
  const monthLabel = new Intl.DateTimeFormat("en-US", {
    month: "long",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(2026, month - 1, 1)));

  return `${day} ${monthLabel}`;
}

export function formatJourneyRange(item: MediaItem): string {
  const start = getJourneyStart(item);
  const end = getJourneyEnd(item);

  if (start === end) {
    return formatJourneyDay(start);
  }

  return `${formatJourneyDay(start)} — ${formatJourneyDay(end)}`;
}

export function formatFinishLabel(item: MediaItem): string | null {
  const end = getJourneyEnd(item);
  const start = getJourneyStart(item);

  if (start === end) {
    return null;
  }

  return `${formatJourneyDay(end)} finish`;
}

const TYPE_EMOJI: Record<MediaItem["type"], string> = {
  book: "📗",
  movie: "🎬",
  music: "🎵",
};

export function getMediaTypeEmoji(type: MediaItem["type"]): string {
  return TYPE_EMOJI[type];
}

export function mergeMediaWithJourneyOverrides(
  items: MediaItem[],
  overrides: Map<
    string,
    { startDate: string; endDate: string; journeyColor: JourneyColor }
  >,
): MediaItem[] {
  return items.map((item) => {
    const override = overrides.get(item.id);

    if (!override) {
      return item;
    }

    const start = isValidDateString(override.startDate)
      ? override.startDate
      : getJourneyStart(item);
    let end = isValidDateString(override.endDate)
      ? override.endDate
      : getJourneyEnd(item);

    if (end < start) {
      end = start;
    }

    return {
      ...item,
      startDate: start,
      endDate: end !== start ? end : undefined,
      journeyColor: normalizeJourneyColor(
        override.journeyColor,
        getJourneyColor(item),
      ),
    };
  });
}
