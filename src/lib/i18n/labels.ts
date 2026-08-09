import type { ContentType } from "@/lib/content/types";
import type { MessageKey, TranslateFn } from "@/lib/i18n";
import type {
  LibraryStatusFilter,
  LibraryTypeFilter,
} from "@/lib/library/library-types";

/** Phase-1 media type labels via shared translations (not API metadata). */
export function mediaTypeLabel(
  t: TranslateFn,
  type: ContentType,
  plural = false,
): string {
  if (type === "BOOK") {
    return t(plural ? "media.books" : "media.book");
  }
  if (type === "MOVIE") {
    return t(plural ? "media.movies" : "media.movie");
  }
  return t("media.music");
}

export function libraryTypeFilterLabel(
  t: TranslateFn,
  type: LibraryTypeFilter,
): string {
  if (type === "all") return t("media.all");
  return mediaTypeLabel(t, type, true);
}

export function libraryStatusFilterLabel(
  t: TranslateFn,
  status: LibraryStatusFilter,
): string {
  const map: Record<LibraryStatusFilter, MessageKey> = {
    all: "media.all",
    WANT: "status.want",
    ONGOING: "status.inProgress",
    FINISHED: "status.finished",
    DROPPED: "status.dropped",
  };
  return t(map[status]);
}
