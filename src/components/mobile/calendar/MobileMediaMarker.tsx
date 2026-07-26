import type { MediaType } from "@/types/media";

import { MEDIA_TYPE_EMOJI } from "@/lib/calendar/constants";

type MobileMediaMarkerProps = {
  types: MediaType[];
};

export function MobileMediaMarker({ types }: MobileMediaMarkerProps) {
  if (types.length === 0) {
    return (
      <span
        aria-hidden="true"
        className="mt-0.5 block size-1.5 rounded-full border border-white/15 bg-transparent"
      />
    );
  }

  const unique = [...new Set(types)].slice(0, 2);

  return (
    <span className="mt-0.5 flex items-center justify-center gap-0.5 text-[11px] leading-none">
      {unique.map((type) => (
        <span key={type} aria-hidden="true">
          {MEDIA_TYPE_EMOJI[type]}
        </span>
      ))}
    </span>
  );
}
