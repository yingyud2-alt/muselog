"use client";

import { cn } from "@/lib/utils";
import { MEMORY_MOOD_TAGS } from "@/lib/content/constants";

type MoodTagPickerProps = {
  value: string[];
  onChange: (value: string[]) => void;
};

export function MoodTagPicker({ value, onChange }: MoodTagPickerProps) {
  const toggle = (tagId: string) => {
    if (value.includes(tagId)) {
      onChange(value.filter((item) => item !== tagId));
      return;
    }

    onChange([...value, tagId]);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {MEMORY_MOOD_TAGS.map((tag) => {
        const selected = value.includes(tag.id);

        return (
          <button
            key={tag.id}
            type="button"
            onClick={() => toggle(tag.id)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs transition-colors",
              selected
                ? "border-white/30 bg-white/12 text-white"
                : "border-white/10 bg-white/[0.03] text-white/55 hover:border-white/20 hover:text-white/75",
            )}
          >
            <span aria-hidden="true">{tag.emoji} </span>
            {tag.label}
          </button>
        );
      })}
    </div>
  );
}
