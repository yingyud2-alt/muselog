import type { LibraryMediaType } from "@/lib/library/library-types";
import type { UserMediaStatus } from "@/lib/content/user-media-state";

type StatusLabels = {
  want: string;
  ongoing: string;
  ongoingShort: string;
  finished: string;
  startNow: string;
  again: string;
  completedRate: string;
  ratingTitle: string;
  completedDate: string;
};

const BOOK: StatusLabels = {
  want: "Want to Read",
  ongoing: "Reading",
  ongoingShort: "Read",
  finished: "Finished",
  startNow: "Start Reading",
  again: "Read Again",
  completedRate: "Mark as Read & Rate",
  ratingTitle: "Finished reading?",
  completedDate: "Completed date",
};

const MOVIE: StatusLabels = {
  want: "Want to Watch",
  ongoing: "Watching",
  ongoingShort: "Watch",
  finished: "Finished",
  startNow: "Start Watching",
  again: "Watch Again",
  completedRate: "Mark as Watched & Rate",
  ratingTitle: "Finished watching?",
  completedDate: "Watched date",
};

const MUSIC: StatusLabels = {
  want: "Want to Listen",
  ongoing: "Listening",
  ongoingShort: "Listen",
  finished: "Finished",
  startNow: "Start Listening",
  again: "Listen Again",
  completedRate: "Mark as Listened & Rate",
  ratingTitle: "Finished listening?",
  completedDate: "Listened date",
};

export function getLibraryLabels(type: LibraryMediaType): StatusLabels {
  if (type === "MOVIE") return MOVIE;
  if (type === "MUSIC") return MUSIC;
  return BOOK;
}

export function getLibraryStatusLabel(
  type: LibraryMediaType,
  status: UserMediaStatus,
  progress?: number,
): string {
  const labels = getLibraryLabels(type);

  if (status === "WANT") return labels.want;
  if (status === "FINISHED") return labels.finished;

  if (status === "ONGOING") {
    if (typeof progress === "number" && progress > 0) {
      return `${labels.ongoing} · ${progress}%`;
    }
    return "In progress";
  }

  return labels.want;
}

export const PROGRESS_COLORS: Record<LibraryMediaType, string> = {
  BOOK: "bg-teal-400/55",
  MOVIE: "bg-amber-400/55",
  MUSIC: "bg-lime-600/45",
};
