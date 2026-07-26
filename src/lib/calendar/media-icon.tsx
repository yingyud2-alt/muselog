import { BookOpen, Film, Headphones, type LucideIcon } from "lucide-react";

import type { MediaType } from "@/types/media";

const MEDIA_ICONS: Record<MediaType, LucideIcon> = {
  book: BookOpen,
  movie: Film,
  music: Headphones,
};

type CalendarMediaIconProps = {
  type: MediaType;
  className?: string;
};

export function CalendarMediaIcon({ type, className }: CalendarMediaIconProps) {
  const Icon = MEDIA_ICONS[type];

  return <Icon className={className} aria-hidden="true" />;
}
