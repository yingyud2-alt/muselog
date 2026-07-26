"use client";

import {
  JOURNEY_COLOR_OPTIONS,
  JOURNEY_COLOR_STYLES,
  type JourneyColor,
} from "@/types/media";
import { cn } from "@/lib/utils";

type MemoryColorPickerProps = {
  value: JourneyColor;
  onChange: (color: JourneyColor) => void;
  label?: string;
  className?: string;
};

export function MemoryColorPicker({
  value,
  onChange,
  label = "Journey Color",
  className,
}: MemoryColorPickerProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <p className="font-label text-[10px] uppercase tracking-[0.12em] text-white/35">
        {label}
      </p>
      <div className="flex flex-wrap gap-2.5" role="radiogroup" aria-label={label}>
        {JOURNEY_COLOR_OPTIONS.map((color) => {
          const active = value === color;
          const meta = JOURNEY_COLOR_STYLES[color];

          return (
            <button
              key={color}
              type="button"
              role="radio"
              onClick={() => onChange(color)}
              aria-label={meta.label}
              aria-checked={active}
              title={meta.label}
              className={cn(
                "size-7 rounded-full transition-all",
                "ring-2 ring-offset-2 ring-offset-[#10161D]",
                "focus-visible:outline-none focus-visible:ring-white/35",
                active
                  ? "ring-white/40"
                  : "ring-transparent hover:ring-white/18",
              )}
              style={{
                backgroundColor: meta.swatch,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
