import { normalizeJourneyColor } from "@/lib/calendar/journey-utils";
import { JOURNEY_COLOR_SWATCHES, type JourneyColor } from "@/types/media";
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
  const swatch = JOURNEY_COLOR_SWATCHES[resolvedColor];

  return (
    <div
      aria-hidden="true"
      className={cn("h-1.5 w-full rounded-full", className)}
      style={{ backgroundColor: `${swatch}99` }}
    />
  );
}
