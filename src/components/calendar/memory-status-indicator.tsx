import { getReadingProgress } from "@/lib/calendar/constants";
import type { MediaStatus } from "@/types/media";
import { cn } from "@/lib/utils";

type MemoryStatusIndicatorProps = {
  status: MediaStatus;
  memoryId: string;
  className?: string;
};

export function MemoryStatusIndicator({
  status,
  memoryId,
  className,
}: MemoryStatusIndicatorProps) {
  if (status === "READING") {
    const progress = getReadingProgress(memoryId);

    return (
      <div
        className={cn("h-1 w-full overflow-hidden rounded-full bg-white/10", className)}
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${progress}% complete`}
      >
        <div
          className="h-full rounded-full"
          style={{
            width: `${progress}%`,
            backgroundColor: "var(--journal-activity-1, rgba(45,212,191,0.75))",
          }}
        />
      </div>
    );
  }

  if (status === "WANT") {
    return (
      <span
        className={cn(
          "text-[8px] uppercase tracking-[0.12em] text-white/35",
          className,
        )}
      >
        Want
      </span>
    );
  }

  return null;
}
