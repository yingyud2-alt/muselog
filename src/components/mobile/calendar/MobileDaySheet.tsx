"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

import { MemoryCover } from "@/components/calendar/memory-cover";
import { MemoryStars } from "@/components/calendar/memory-stars";
import { JournalContent } from "@/components/calendar/JournalContent";
import {
  MEDIA_STATUS_LABELS,
} from "@/lib/calendar/constants";
import { formatCardDate } from "@/lib/calendar/utils";
import { hasMuseActivity } from "@/lib/habit/habit-mock";
import type { HabitLog } from "@/types/habit";
import { MEDIA_EXPLORE_IDS } from "@/types/media";
import type { MediaItem } from "@/types/media";
import { cn } from "@/lib/utils";

type MobileDaySheetProps = {
  date: string | null;
  memories: MediaItem[];
  habitLog: HabitLog | null;
  onClose: () => void;
  onSelectItem?: (item: MediaItem) => void;
};

function HabitSummary({ log }: { log: HabitLog }) {
  const activities = [
    log.read && "📖 Read",
    log.watch && "🎬 Watch",
    log.listen && "🎵 Listen",
  ].filter(Boolean);

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
      <p className="text-[10px] uppercase tracking-[0.12em] text-white/35">
        Today&apos;s muse
      </p>
      <p className="mt-2 text-sm text-white/65">{activities.join(" · ")}</p>
      <p className="mt-1 text-xs text-white/38">{log.duration} min</p>
    </div>
  );
}

function MemoryDetail({ item }: { item: MediaItem }) {
  const exploreId = MEDIA_EXPLORE_IDS[item.id];

  return (
    <div className="space-y-4">
      <div className="mx-auto w-full max-w-[160px]">
        <MemoryCover
          cover={item.cover}
          title={item.title}
          className="rounded-[14px]"
          overlay="deep"
        />
      </div>

      <div className="text-center">
        <h3 className="text-xl font-semibold tracking-tight text-white/92">
          {item.title}
        </h3>
        <p className="mt-1 text-sm text-white/48">{item.creator}</p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        {item.rating > 0 && <MemoryStars rating={item.rating} size="md" />}
        <span className="rounded-full border border-white/12 px-3 py-0.5 text-xs text-white/55">
          {MEDIA_STATUS_LABELS[item.status]}
        </span>
      </div>

      <JournalContent
        note={item.note}
        quote={item.quote}
        tags={item.tags}
        className="space-y-3"
      />

      {exploreId && (
        <Link
          href={`/explore/${exploreId}`}
          className="flex w-full items-center justify-center rounded-full bg-white/92 py-2.5 text-sm font-medium text-black transition-colors hover:bg-white"
        >
          View detail
        </Link>
      )}
    </div>
  );
}

export function MobileDaySheet({
  date,
  memories,
  habitLog,
  onClose,
  onSelectItem,
}: MobileDaySheetProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const primary = memories[0] ?? null;

  useEffect(() => {
    if (!date) {
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
  }, [date, onClose]);

  return (
    <AnimatePresence>
      {date && (
        <>
          <motion.button
            type="button"
            aria-label="Close day detail"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/45 backdrop-blur-md"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Day memories"
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
              "fixed inset-x-0 bottom-0 z-50 flex max-h-[85vh] flex-col",
              "rounded-t-[24px] border border-white/12 border-b-0 bg-[#10161D]/95",
              "shadow-[0_-12px_60px_rgba(0,0,0,0.45)] backdrop-blur-2xl",
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

            <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-[calc(env(safe-area-inset-bottom)+24px)] pt-4">
              <p className="text-center text-xs text-white/38">
                {formatCardDate(date)}
              </p>

              {memories.length > 1 ? (
                <ul className="mt-4 space-y-2">
                  {memories.map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => onSelectItem?.(item)}
                        className="flex w-full items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-3 text-left"
                      >
                        <MemoryCover
                          cover={item.cover}
                          title={item.title}
                          className="w-12 shrink-0 rounded-lg"
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-white/88">
                            {item.title}
                          </p>
                          {item.rating > 0 && (
                            <MemoryStars rating={item.rating} size="xs" />
                          )}
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : primary ? (
                <div className="mt-4">
                  <MemoryDetail item={primary} />
                </div>
              ) : habitLog && hasMuseActivity(habitLog) ? (
                <div className="mt-6">
                  <HabitSummary log={habitLog} />
                </div>
              ) : (
                <p className="mt-10 text-center text-sm italic text-white/42">
                  A quiet day — no memories yet.
                </p>
              )}

              {primary && habitLog && hasMuseActivity(habitLog) && (
                <div className="mt-4">
                  <HabitSummary log={habitLog} />
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
