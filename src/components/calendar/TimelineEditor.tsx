"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

import { MemoryColorPicker } from "@/components/calendar/memory-color-picker";
import type { JourneyColor } from "@/types/media";
import { cn } from "@/lib/utils";

type TimelineEditorProps = {
  startDate: string;
  endDate: string;
  journeyColor: JourneyColor;
  onSave: (
    startDate: string,
    endDate: string,
    journeyColor: JourneyColor,
  ) => void;
  onClose: () => void;
};

const PANEL_TRANSITION = {
  type: "spring" as const,
  damping: 28,
  stiffness: 380,
  mass: 0.85,
};

export function TimelineEditor({
  startDate,
  endDate,
  journeyColor,
  onSave,
  onClose,
}: TimelineEditorProps) {
  const [draftStart, setDraftStart] = useState(startDate);
  const [draftEnd, setDraftEnd] = useState(endDate);
  const [draftColor, setDraftColor] = useState(journeyColor);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
      }
    };

    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [onClose]);

  const handleSave = () => {
    onSave(draftStart, draftEnd, draftColor);
    onClose();
  };

  const form = (
    <>
      <h2 className="font-display text-lg font-bold tracking-tight text-white/90">
        Edit Timeline
      </h2>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <label className="space-y-1.5">
          <span className="font-label text-[10px] uppercase tracking-[0.12em] text-white/38">
            Start Date
          </span>
          <input
            type="date"
            value={draftStart}
            onChange={(event) => setDraftStart(event.target.value)}
            className={cn(
              "w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5",
              "text-sm text-white/80 outline-none",
              "focus-visible:ring-2 focus-visible:ring-white/12",
            )}
          />
        </label>
        <label className="space-y-1.5">
          <span className="font-label text-[10px] uppercase tracking-[0.12em] text-white/38">
            End Date
          </span>
          <input
            type="date"
            value={draftEnd}
            onChange={(event) => setDraftEnd(event.target.value)}
            className={cn(
              "w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5",
              "text-sm text-white/80 outline-none",
              "focus-visible:ring-2 focus-visible:ring-white/12",
            )}
          />
        </label>
      </div>

      <MemoryColorPicker
        value={draftColor}
        onChange={setDraftColor}
        label="Journey Color"
        className="mt-6"
      />

      <div className="mt-8 flex gap-2.5">
        <button
          type="button"
          onClick={onClose}
          className={cn(
            "flex-1 rounded-full border border-white/10 bg-transparent py-2.5",
            "font-display text-[13px] font-bold text-white/48",
            "transition-colors hover:bg-white/[0.04] hover:text-white/68",
          )}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          className={cn(
            "flex-1 rounded-full border border-white/12 bg-white/[0.08] py-2.5",
            "font-display text-[13px] font-bold text-white/82",
            "transition-colors hover:bg-white/[0.12]",
          )}
        >
          Save
        </button>
      </div>
    </>
  );

  return (
    <motion.div
      className="fixed inset-0 z-[60]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22 }}
    >
      <button
        type="button"
        aria-label="Close timeline editor"
        onClick={onClose}
        className="absolute inset-0 bg-black/35 backdrop-blur-[2px]"
      />

      {/* Desktop — centered floating glass card */}
      <div className="pointer-events-none absolute inset-0 hidden items-center justify-center p-6 md:flex">
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Edit Timeline"
          initial={{ opacity: 0, y: 14, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8 }}
          transition={PANEL_TRANSITION}
          className={cn(
            "pointer-events-auto w-full max-w-[480px] rounded-[24px] p-8",
            "border border-white/[0.08] shadow-[0_24px_64px_rgba(0,0,0,0.45)]",
          )}
          style={{
            background: "rgba(20,25,35,0.85)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
          }}
        >
          {form}
        </motion.div>
      </div>

      {/* Mobile — bottom sheet, not fullscreen */}
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="Edit Timeline"
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 18 }}
        transition={PANEL_TRANSITION}
        className={cn(
          "absolute inset-x-0 bottom-0 md:hidden",
          "rounded-t-[24px] border border-white/[0.08] border-b-0 px-5 pb-[calc(env(safe-area-inset-bottom)+20px)] pt-3",
          "shadow-[0_-16px_48px_rgba(0,0,0,0.4)]",
        )}
        style={{
          background: "rgba(20,25,35,0.92)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        }}
      >
        <div
          className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20"
          aria-hidden="true"
        />
        {form}
      </motion.div>
    </motion.div>
  );
}
