"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

import { formatDurationLabel } from "@/components/habit/CustomDurationInput";
import {
  formatActivityDayLabel,
  getActivityLogsForMonth,
} from "@/lib/habit/habit-matrix-utils";
import { useHabitLogs } from "@/lib/habit/habit-store";
import type { MuseActivity } from "@/types/habit";
import { cn } from "@/lib/utils";

const ACTIVITY_META: Record<
  MuseActivity,
  { label: string; emoji: string; dotClass: string }
> = {
  read: { label: "Reading", emoji: "📖", dotClass: "bg-teal-400/50" },
  watch: { label: "Watching", emoji: "🎬", dotClass: "bg-amber-400/45" },
  listen: { label: "Listening", emoji: "🎵", dotClass: "bg-lime-600/40" },
};

type HabitDetailSheetProps = {
  activity: MuseActivity | null;
  year: number;
  month: number;
  onClose: () => void;
};

export function HabitDetailSheet({
  activity,
  year,
  month,
  onClose,
}: HabitDetailSheetProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const { logs } = useHabitLogs();

  useEffect(() => {
    if (!activity) {
      return;
    }

    closeRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [activity, onClose]);

  const meta = activity ? ACTIVITY_META[activity] : null;
  const activityLogs = activity
    ? getActivityLogsForMonth(logs, year, month, activity)
    : [];

  return (
    <AnimatePresence>
      {activity && meta && (
        <>
          <motion.button
            type="button"
            aria-label="Close habit detail"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[55] bg-black/45 backdrop-blur-md"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={`${meta.label} detail`}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 360, mass: 0.9 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.05, bottom: 0.35 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 96 || info.velocity.y > 600) {
                onClose();
              }
            }}
            className={cn(
              "fixed inset-x-0 bottom-0 z-[55] flex max-h-[70vh] flex-col",
              "rounded-t-[24px] border border-white/12 border-b-0 bg-[#10161D]/95",
              "shadow-[0_-12px_60px_rgba(0,0,0,0.45)] backdrop-blur-2xl",
              "md:mx-auto md:max-w-md",
            )}
          >
            <div className="flex shrink-0 flex-col items-center pt-3">
              <div
                aria-hidden="true"
                className="h-1 w-10 rounded-full bg-white/20"
              />
              <button
                ref={closeRef}
                type="button"
                aria-label="Close"
                onClick={onClose}
                className="absolute right-4 top-4 flex size-8 items-center justify-center rounded-full border border-white/12 bg-black/40 text-white/75"
              >
                <X className="size-3.5" />
              </button>
            </div>

            <div className="overflow-y-auto px-5 pb-[calc(env(safe-area-inset-bottom)+24px)] pt-4">
              <div className="flex items-center gap-2">
                <span aria-hidden="true">{meta.emoji}</span>
                <h2 className="text-lg font-medium text-white/90">{meta.label}</h2>
              </div>
              <p className="mt-1 text-sm text-white/42">
                {activityLogs.length} days this month
              </p>

              <ul className="mt-5 space-y-2">
                {activityLogs.length === 0 ? (
                  <li className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-6 text-center text-sm text-white/38">
                    No entries yet — log from Home when you Muse today.
                  </li>
                ) : (
                  activityLogs.map((log) => (
                    <li
                      key={log.id}
                      className="flex items-center justify-between rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={cn("size-2 rounded-full", meta.dotClass)}
                          aria-hidden="true"
                        />
                        <span className="text-sm text-white/72">
                          {formatActivityDayLabel(log.date)}
                        </span>
                      </div>
                      <span className="text-xs text-white/38">
                        {formatDurationLabel(log.duration)}
                      </span>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
