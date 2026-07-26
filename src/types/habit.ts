export interface HabitLog {
  id: string;
  date: string;
  read: boolean;
  watch: boolean;
  listen: boolean;
  /** Duration in minutes */
  duration: number;
  /** Optional muse moment photo (data URL) */
  photo?: string;
}

export type MuseActivity = "read" | "watch" | "listen";

export type QuickLogInput = {
  read: boolean;
  watch: boolean;
  listen: boolean;
  duration: number;
  photo?: string;
};
