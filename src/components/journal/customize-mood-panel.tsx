"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

import {
  MEDIA_ACTION_OVERLAY_CLASS,
  MEDIA_ACTION_PANEL_CLASS,
} from "@/components/shared/media-action-modal";
import {
  MOOD_ATMOSPHERES,
  MOOD_EMOTIONS,
  MOOD_INTERESTS,
  useMoodPreferences,
} from "@/lib/preferences/mood-preference-store";
import { cn } from "@/lib/utils";
import type {
  MoodAtmosphere,
  MoodEmotion,
  MoodInterest,
  MoodPreferenceProfile,
} from "@/types/preferences";

type CustomizeMoodPanelProps = {
  open: boolean;
  onClose: () => void;
};

function ChipGroup<T extends string>({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: { id: T; label: string }[];
  selected: T[];
  onToggle: (id: T) => void;
}) {
  return (
    <div>
      <p className="font-label mb-2 text-[10px] uppercase tracking-[0.16em] text-white/35">
        {label}
      </p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = selected.includes(option.id);

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onToggle(option.id)}
              className={cn(
                "rounded-full border px-3 py-1.5 font-display text-sm transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300/25",
                active
                  ? "border-teal-300/28 bg-teal-400/[0.1] font-bold text-teal-50/90"
                  : "border-white/10 bg-white/[0.03] text-white/48 hover:text-white/72",
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CustomizeMoodForm({
  initial,
  onSave,
  onClose,
}: {
  initial: MoodPreferenceProfile;
  onSave: (next: Omit<MoodPreferenceProfile, "updatedAt">) => void;
  onClose: () => void;
}) {
  const [emotions, setEmotions] = useState<MoodEmotion[]>(initial.emotions);
  const [interests, setInterests] = useState<MoodInterest[]>(initial.interests);
  const [atmospheres, setAtmospheres] = useState<MoodAtmosphere[]>(
    initial.atmospheres,
  );

  const toggle = <T extends string>(
    list: T[],
    id: T,
    setter: (next: T[]) => void,
  ) => {
    setter(
      list.includes(id)
        ? list.filter((item) => item !== id)
        : list.length >= 3
          ? [...list.slice(1), id]
          : [...list, id],
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="font-label text-[10px] uppercase tracking-[0.18em] text-white/35">
          Preference
        </p>
        <h2 className="font-display mt-1 text-xl font-bold tracking-tight text-white/92">
          Customize your mood
        </h2>
        <p className="font-display mt-1.5 text-sm text-white/42">
          Shape the emotional lens for your Muse recommendations
        </p>
      </div>

      <ChipGroup
        label="Emotion"
        options={MOOD_EMOTIONS}
        selected={emotions}
        onToggle={(id) => toggle(emotions, id, setEmotions)}
      />
      <ChipGroup
        label="Atmosphere"
        options={MOOD_ATMOSPHERES}
        selected={atmospheres}
        onToggle={(id) => toggle(atmospheres, id, setAtmospheres)}
      />
      <ChipGroup
        label="Interest"
        options={MOOD_INTERESTS}
        selected={interests}
        onToggle={(id) => toggle(interests, id, setInterests)}
      />

      <button
        type="button"
        onClick={() => {
          onSave({ emotions, interests, atmospheres });
          onClose();
        }}
        className="inline-flex w-full items-center justify-center rounded-full border border-teal-300/20 bg-teal-400/[0.12] px-4 py-2.5 font-display text-sm font-bold text-teal-50/90 transition-colors hover:bg-teal-400/[0.18] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300/25"
      >
        Save changes
      </button>
    </div>
  );
}

export function CustomizeMoodPanel({ open, onClose }: CustomizeMoodPanelProps) {
  const { profile, saveProfile } = useMoodPreferences();

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            aria-label="Close customize mood"
            className={MEDIA_ACTION_OVERLAY_CLASS}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <div className="pointer-events-none fixed inset-0 z-50 hidden items-center justify-center p-8 md:flex">
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Customize your mood"
              initial={{ opacity: 0, y: 14, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.99 }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className={cn(
                "pointer-events-auto relative w-[min(92vw,460px)] rounded-3xl p-6 text-white",
                MEDIA_ACTION_PANEL_CLASS,
              )}
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                aria-label="Close"
                onClick={onClose}
                className="absolute right-4 top-4 flex size-8 items-center justify-center rounded-full border border-white/10 bg-black/25 text-white/65 transition hover:text-white/90"
              >
                <X className="size-3.5" />
              </button>

              <CustomizeMoodForm
                key={profile.updatedAt}
                initial={profile}
                onSave={saveProfile}
                onClose={onClose}
              />
            </motion.div>
          </div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
