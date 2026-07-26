export type TimelineColor = "teal" | "blue" | "green" | "purple";

export interface MediaTimeline {
  mediaId: string;
  startDate: string;
  endDate: string;
  color: TimelineColor;
}

export const TIMELINE_COLOR_STYLES: Record<
  TimelineColor,
  { bar: string; dot: string; label: string }
> = {
  teal: {
    bar: "bg-teal-400/55",
    dot: "border-teal-300/40 bg-teal-400/20",
    label: "Teal",
  },
  blue: {
    bar: "bg-sky-400/55",
    dot: "border-sky-300/40 bg-sky-400/20",
    label: "Blue",
  },
  green: {
    bar: "bg-emerald-400/55",
    dot: "border-emerald-300/40 bg-emerald-400/20",
    label: "Green",
  },
  purple: {
    bar: "bg-violet-400/55",
    dot: "border-violet-300/40 bg-violet-400/20",
    label: "Purple",
  },
};

export const TIMELINE_COLOR_OPTIONS: TimelineColor[] = [
  "teal",
  "blue",
  "green",
  "purple",
];
