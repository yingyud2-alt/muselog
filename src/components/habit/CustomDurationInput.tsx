"use client";

import { cn } from "@/lib/utils";

type CustomDurationInputProps = {
  hours: number;
  minutes: number;
  onHoursChange: (hours: number) => void;
  onMinutesChange: (minutes: number) => void;
  className?: string;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function CustomDurationInput({
  hours,
  minutes,
  onHoursChange,
  onMinutesChange,
  className,
}: CustomDurationInputProps) {
  return (
    <div className={cn("flex items-center justify-center gap-3", className)}>
      <label className="flex flex-col items-center gap-1">
        <span className="text-[10px] uppercase tracking-[0.12em] text-white/35">
          Hours
        </span>
        <input
          type="number"
          min={0}
          max={12}
          inputMode="numeric"
          value={String(hours).padStart(2, "0")}
          onChange={(event) =>
            onHoursChange(clamp(Number(event.target.value) || 0, 0, 12))
          }
          className="w-14 rounded-xl border border-white/10 bg-white/[0.04] py-2 text-center text-sm text-white/85 outline-none focus:border-white/20"
        />
      </label>
      <span className="mt-5 text-white/30">:</span>
      <label className="flex flex-col items-center gap-1">
        <span className="text-[10px] uppercase tracking-[0.12em] text-white/35">
          Minutes
        </span>
        <input
          type="number"
          min={0}
          max={59}
          inputMode="numeric"
          value={String(minutes).padStart(2, "0")}
          onChange={(event) =>
            onMinutesChange(clamp(Number(event.target.value) || 0, 0, 59))
          }
          className="w-14 rounded-xl border border-white/10 bg-white/[0.04] py-2 text-center text-sm text-white/85 outline-none focus:border-white/20"
        />
      </label>
    </div>
  );
}

export function customDurationToMinutes(hours: number, minutes: number): number {
  return hours * 60 + minutes;
}

export function minutesToCustomDuration(totalMinutes: number): {
  hours: number;
  minutes: number;
} {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return { hours, minutes };
}

export function formatDurationLabel(minutes: number): string {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remainder = minutes % 60;

    if (remainder === 0) {
      return `${hours}h`;
    }

    return `${hours}h ${remainder}m`;
  }

  return `${minutes} min`;
}
