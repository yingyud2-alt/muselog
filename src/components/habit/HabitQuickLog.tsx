"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ImagePlus, X } from "lucide-react";

import {
  CustomDurationInput,
  customDurationToMinutes,
  formatDurationLabel,
  minutesToCustomDuration,
} from "@/components/habit/CustomDurationInput";
import { PhotoUploadButton } from "@/components/shared/PhotoUploadButton";
import { getDisplayTodayString } from "@/lib/habit/habit-utils";
import { useHabitLogs } from "@/lib/habit/habit-store";
import type { QuickLogInput } from "@/types/habit";
import { cn } from "@/lib/utils";

const PRESET_DURATIONS = [15, 30, 60] as const;

const ACTIVITY_OPTIONS = [
  { key: "read" as const, label: "Read", emoji: "📖" },
  { key: "watch" as const, label: "Watch", emoji: "🎬" },
  { key: "listen" as const, label: "Listen", emoji: "🎵" },
];

type HabitQuickLogProps = {
  open: boolean;
  onClose: () => void;
};

export function HabitQuickLog({ open, onClose }: HabitQuickLogProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const { saveLog } = useHabitLogs();
  const [read, setRead] = useState(false);
  const [watch, setWatch] = useState(false);
  const [listen, setListen] = useState(false);
  const [duration, setDuration] = useState<number>(30);
  const [customOpen, setCustomOpen] = useState(false);
  const [customHours, setCustomHours] = useState(0);
  const [customMinutes, setCustomMinutes] = useState(30);
  const [photo, setPhoto] = useState<string | undefined>();

  useEffect(() => {
    if (!open) {
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
  }, [open, onClose]);

  const resetForm = () => {
    setRead(false);
    setWatch(false);
    setListen(false);
    setDuration(30);
    setCustomOpen(false);
    setCustomHours(0);
    setCustomMinutes(30);
    setPhoto(undefined);
  };

  const toggle = (key: "read" | "watch" | "listen") => {
    if (key === "read") setRead((value) => !value);
    if (key === "watch") setWatch((value) => !value);
    if (key === "listen") setListen((value) => !value);
  };

  const selectPreset = (minutes: number) => {
    setDuration(minutes);
    setCustomOpen(false);
    const custom = minutesToCustomDuration(minutes);
    setCustomHours(custom.hours);
    setCustomMinutes(custom.minutes);
  };

  const selectCustom = () => {
    setCustomOpen(true);
    setDuration(customDurationToMinutes(customHours, customMinutes));
  };

  const handleSave = () => {
    const finalDuration = customOpen
      ? customDurationToMinutes(customHours, customMinutes)
      : duration;

    const input: QuickLogInput = {
      read,
      watch,
      listen,
      duration: finalDuration,
      photo,
    };

    saveLog(getDisplayTodayString(), input);
    onClose();
    resetForm();
  };

  const canSave = read || watch || listen;
  const previewDuration = customOpen
    ? customDurationToMinutes(customHours, customMinutes)
    : duration;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            aria-label="Close quick log"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/45 backdrop-blur-md md:hidden"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Quick log"
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
              "fixed inset-x-0 bottom-0 z-[60] flex max-h-[85vh] flex-col md:hidden",
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

            <div className="flex-1 overflow-y-auto px-5 pb-[calc(env(safe-area-inset-bottom)+24px)] pt-5">
              <h2 className="text-lg font-medium text-white/90">
                What did you spend time with?
              </h2>

              <div className="mt-5 grid grid-cols-3 gap-2">
                {ACTIVITY_OPTIONS.map((option) => {
                  const active =
                    option.key === "read"
                      ? read
                      : option.key === "watch"
                        ? watch
                        : listen;

                  return (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => toggle(option.key)}
                      className={cn(
                        "flex flex-col items-center gap-1.5 rounded-2xl border py-4 transition-colors",
                        active
                          ? "border-white/20 bg-white/[0.08] text-white"
                          : "border-white/10 bg-white/[0.03] text-white/55",
                      )}
                    >
                      <span className="text-xl" aria-hidden="true">
                        {option.emoji}
                      </span>
                      <span className="text-xs">{option.label}</span>
                    </button>
                  );
                })}
              </div>

              <p className="mt-6 text-xs uppercase tracking-[0.12em] text-white/35">
                Duration
              </p>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {PRESET_DURATIONS.map((minutes) => (
                  <button
                    key={minutes}
                    type="button"
                    onClick={() => selectPreset(minutes)}
                    className={cn(
                      "rounded-full border py-2 text-sm transition-colors",
                      !customOpen && duration === minutes
                        ? "border-white/25 bg-white/12 text-white"
                        : "border-white/10 text-white/45",
                    )}
                  >
                    {minutes === 60 ? "1 hour" : `${minutes} min`}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={selectCustom}
                  className={cn(
                    "rounded-full border py-2 text-sm transition-colors",
                    customOpen
                      ? "border-white/25 bg-white/12 text-white"
                      : "border-white/10 text-white/45",
                  )}
                >
                  Custom
                </button>
              </div>

              {customOpen && (
                <div className="mt-4 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
                  <CustomDurationInput
                    hours={customHours}
                    minutes={customMinutes}
                    onHoursChange={(hours) => {
                      setCustomHours(hours);
                      setDuration(customDurationToMinutes(hours, customMinutes));
                    }}
                    onMinutesChange={(minutes) => {
                      setCustomMinutes(minutes);
                      setDuration(customDurationToMinutes(customHours, minutes));
                    }}
                  />
                  <p className="mt-3 text-center text-sm text-white/50">
                    {formatDurationLabel(previewDuration)}
                  </p>
                </div>
              )}

              <div className="mt-6">
                <p className="text-xs uppercase tracking-[0.12em] text-white/35">
                  Photo
                </p>
                {photo ? (
                  <div className="relative mt-2 overflow-hidden rounded-2xl ring-1 ring-white/10">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo}
                      alt="Muse moment preview"
                      className="aspect-[4/3] w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setPhoto(undefined)}
                      className="absolute right-2 top-2 rounded-full border border-white/12 bg-black/50 px-2 py-1 text-[10px] text-white/75"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="mt-2">
                    <PhotoUploadButton
                      label="Add photo"
                      onPhotoSelected={setPhoto}
                      className="flex items-center justify-center gap-2"
                    />
                    <p className="mt-2 flex items-center gap-1.5 text-[11px] text-white/30">
                      <ImagePlus className="size-3" aria-hidden="true" />
                      Capture a moment from today
                    </p>
                  </div>
                )}
              </div>

              <button
                type="button"
                disabled={!canSave}
                onClick={handleSave}
                className="mt-8 w-full rounded-full bg-white/92 py-3 text-sm font-medium text-black transition-colors hover:bg-white disabled:bg-white/20 disabled:text-white/35"
              >
                Save
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
