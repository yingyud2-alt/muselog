"use client";

import type { ImportStep } from "@/lib/import/import-types";
import { cn } from "@/lib/utils";

const STEPS: Array<{ id: ImportStep; label: string }> = [
  { id: "UPLOAD", label: "Upload" },
  { id: "MAP", label: "Map fields" },
  { id: "REVIEW", label: "Review" },
  { id: "CONFIRM", label: "Import" },
];

type ImportStepIndicatorProps = {
  current: ImportStep;
};

export function ImportStepIndicator({ current }: ImportStepIndicatorProps) {
  const currentIndex = STEPS.findIndex((step) => step.id === current);

  return (
    <ol className="flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-white/35 md:gap-3 md:text-xs">
      {STEPS.map((step, index) => {
        const active = step.id === current;
        const done = currentIndex > index || current === "RESULT";

        return (
          <li key={step.id} className="flex items-center gap-2 md:gap-3">
            <span
              className={cn(
                active && "text-teal-300/80",
                done && !active && "text-white/50",
              )}
            >
              {index + 1}. {step.label}
            </span>
            {index < STEPS.length - 1 && (
              <span className="hidden h-px w-6 bg-white/10 sm:block md:w-10" />
            )}
          </li>
        );
      })}
    </ol>
  );
}
