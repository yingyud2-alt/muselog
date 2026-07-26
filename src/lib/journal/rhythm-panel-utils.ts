import type { HabitLog, MuseActivity } from "@/types/habit";
import type { MediaItem, MediaType } from "@/types/media";

export type RhythmPanelType = "reading" | "watching" | "listening";

export type RhythmDayEntry = {
  id: string;
  date: string;
  title: string;
  creator: string;
  note: string;
  durationMinutes: number;
  mediaType: MediaType;
  startDate?: string;
  endDate?: string;
  source: "journal" | "habit";
  journalId?: string;
};

export type DailyJourneyGroup = {
  type: RhythmPanelType;
  label: string;
  entries: RhythmDayEntry[];
};

export type RhythmDaySummary = {
  date: string;
  day: number;
  minutes: number;
  entries: RhythmDayEntry[];
  hasActivity: boolean;
};

const RHYTHM_META: Record<
  RhythmPanelType,
  {
    activity: MuseActivity;
    mediaType: MediaType;
    label: string;
    typeLabel: string;
    emoji: string;
    accent: string;
    barClass: string;
  }
> = {
  reading: {
    activity: "read",
    mediaType: "book",
    label: "Reading",
    typeLabel: "BOOK",
    emoji: "📖",
    accent: "text-teal-100/80",
    barClass: "bg-teal-300/55",
  },
  watching: {
    activity: "watch",
    mediaType: "movie",
    label: "Watching",
    typeLabel: "MOVIE",
    emoji: "🎬",
    accent: "text-sky-100/80",
    barClass: "bg-sky-300/50",
  },
  listening: {
    activity: "listen",
    mediaType: "music",
    label: "Listening",
    typeLabel: "MUSIC",
    emoji: "🎵",
    accent: "text-[#7AD9BD]/85",
    barClass: "bg-[#7AD9BD]/45",
  },
};

export function getRhythmMeta(type: RhythmPanelType) {
  return RHYTHM_META[type];
}

export function museActivityToRhythmType(
  activity: MuseActivity,
): RhythmPanelType {
  if (activity === "read") return "reading";
  if (activity === "watch") return "watching";
  return "listening";
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function formatMinutesLabel(minutes: number): string {
  if (minutes <= 0) return "0";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (rest === 0) return `${hours}h`;
  return `${hours}h ${rest}m`;
}

const LONG_MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

/** Example: July 15 2026 */
export function formatRhythmLongDate(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  if (!year || !month || !day) return date;
  return `${LONG_MONTHS[month - 1]} ${day} ${year}`;
}

export function formatRhythmTimeline(
  startDate?: string,
  endDate?: string,
  fallbackDate?: string,
): string | null {
  if (startDate && endDate && startDate !== endDate) {
    return `${startDate} → ${endDate}`;
  }
  return startDate || endDate || fallbackDate || null;
}

export function mediaTypeToRhythmType(type: MediaType): RhythmPanelType {
  if (type === "book") return "reading";
  if (type === "movie") return "watching";
  return "listening";
}

function resolveEntryMinutes(item: MediaItem): number {
  if (typeof item.durationMinutes === "number" && item.durationMinutes > 0) {
    return item.durationMinutes;
  }
  if (typeof item.duration === "number" && item.duration > 0) {
    return item.duration;
  }
  return 0;
}

/** All memory types for one calendar day — Daily Journey grouping. */
export function buildDailyJourneyGroups(
  date: string,
  habitLogs: HabitLog[],
  journalEntries: MediaItem[],
): DailyJourneyGroup[] {
  const habit = habitLogs.find((log) => log.date === date);
  const groups: DailyJourneyGroup[] = (
    ["reading", "watching", "listening"] as const
  ).map((type) => {
    const meta = getRhythmMeta(type);
    const journals = journalEntries.filter((entry) => {
      if (entry.type !== meta.mediaType) return false;
      const entryDate = entry.date || entry.startDate;
      return entryDate === date;
    });

    const entries: RhythmDayEntry[] = journals.map((item) => ({
      id: item.id,
      date,
      title: item.title,
      creator: item.creator || "",
      note: item.note || item.notes || "",
      durationMinutes: resolveEntryMinutes(item) || habit?.duration || 0,
      mediaType: item.type,
      startDate: item.startDate || item.date,
      endDate: item.endDate || item.date,
      source: "journal" as const,
      journalId: item.id,
    }));

    const habitActive = Boolean(habit?.[meta.activity]);
    if (habitActive && entries.length === 0) {
      entries.push({
        id: `habit-${date}-${meta.activity}`,
        date,
        title: meta.label,
        creator: "",
        note: "",
        durationMinutes: habit?.duration ?? 0,
        mediaType: meta.mediaType,
        startDate: date,
        endDate: date,
        source: "habit",
      });
    }

    return {
      type,
      label: meta.label,
      entries,
    };
  });

  return groups.filter((group) => group.entries.length > 0);
}

export function buildRhythmDaySummaries(
  type: RhythmPanelType,
  year: number,
  month: number,
  habitLogs: HabitLog[],
  journalEntries: MediaItem[],
): RhythmDaySummary[] {
  const meta = getRhythmMeta(type);
  const totalDays = daysInMonth(year, month);
  const habitByDate = new Map(habitLogs.map((log) => [log.date, log]));
  const journalByDate = new Map<string, MediaItem[]>();

  for (const entry of journalEntries) {
    if (entry.type !== meta.mediaType) continue;
    const date = entry.date || entry.startDate;
    if (!date) continue;
    const [y, m] = date.split("-").map(Number);
    if (y !== year || m !== month) continue;
    const list = journalByDate.get(date) ?? [];
    list.push(entry);
    journalByDate.set(date, list);
  }

  return Array.from({ length: totalDays }, (_, index) => {
    const day = index + 1;
    const date = `${year}-${pad2(month)}-${pad2(day)}`;
    const habit = habitByDate.get(date);
    const journals = journalByDate.get(date) ?? [];

    const entries: RhythmDayEntry[] = journals.map((item) => ({
      id: item.id,
      date,
      title: item.title,
      creator: item.creator || "",
      note: item.note || item.notes || "",
      durationMinutes: resolveEntryMinutes(item) || habit?.duration || 0,
      mediaType: item.type,
      startDate: item.startDate || item.date,
      endDate: item.endDate || item.date,
      source: "journal" as const,
      journalId: item.id,
    }));

    const habitActive = Boolean(habit?.[meta.activity]);
    if (habitActive && entries.length === 0) {
      entries.push({
        id: `habit-${date}-${meta.activity}`,
        date,
        title: meta.label,
        creator: "",
        note: "",
        durationMinutes: habit?.duration ?? 0,
        mediaType: meta.mediaType,
        startDate: date,
        endDate: date,
        source: "habit",
      });
    }

    const minutes = entries.reduce(
      (sum, entry) => sum + (entry.durationMinutes || 0),
      habitActive && journals.length === 0 ? 0 : 0,
    );
    const resolvedMinutes =
      minutes > 0
        ? minutes
        : habitActive
          ? habit?.duration ?? 0
          : 0;

    return {
      date,
      day,
      minutes: resolvedMinutes,
      entries,
      hasActivity: habitActive || entries.length > 0,
    };
  });
}
