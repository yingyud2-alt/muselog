import { normalizeJourneyColor } from "@/lib/calendar/journey-utils";
import type { JourneyColor } from "@/types/media";
import { JOURNEY_COLOR_STYLES } from "@/types/media";
import { cn } from "@/lib/utils";

type JourneyHighlightBarProps = {
  color: JourneyColor;
  className?: string;
};

export function JourneyHighlightBar({
  color,
  className,
}: JourneyHighlightBarProps) {
  const resolvedColor = normalizeJourneyColor(color, "teal");

  return (
    <div
      aria-hidden="true"
      className={cn(
        "h-1.5 w-full rounded-full",
        JOURNEY_COLOR_STYLES[resolvedColor].highlight,
        className,
      )}
    />
  );
}
