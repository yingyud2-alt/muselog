import { upsertMemory, removeMemory } from "@/lib/content/memory-store";
import {
  removeUserMediaState,
  syncMemoryFromUserState,
  upsertUserMediaState,
  type UserMediaState,
  type UserMediaStatus,
} from "@/lib/content/user-media-state";
import type { ContentType } from "@/lib/content/types";
import { getDisplayTodayString } from "@/lib/habit/habit-utils";
import {
  isRemoteCoverUrl,
  resolveCoverUrl,
} from "@/lib/work/cover-url";
import {
  resolveCanonicalWork,
  resolveCanonicalWorkId,
} from "@/lib/work/resolve-canonical-work";
import type { Work, WorkType, WorkUserStatus } from "@/types/work";

export type WorkStatusIdentity = {
  id: string;
  type: WorkType | ContentType;
  title: string;
  creator: string;
  coverUrl?: string;
  cover?: string;
};

export type SetWorkStatusInput = {
  status: WorkUserStatus;
  rating?: number;
  review?: string;
  droppedReason?: string;
  /** Completed / end date when finishing. */
  endDate?: string;
};

const DROP_REASONS = [
  "Not interested",
  "Too difficult",
  "Not my mood",
  "Other",
] as const;

export type DropReason = (typeof DROP_REASONS)[number];

export function getDropReasons(): readonly DropReason[] {
  return DROP_REASONS;
}

export function toUserMediaStatusFromWork(
  status: WorkUserStatus,
): Exclude<UserMediaStatus, "NONE"> {
  if (status === "want") return "WANT";
  if (status === "finished") return "FINISHED";
  if (status === "dropped") return "DROPPED";
  return "ONGOING";
}

export function toWorkUserStatus(
  status: UserMediaStatus | string | undefined | null,
): WorkUserStatus {
  const value = String(status ?? "").toUpperCase();
  if (value === "WANT") return "want";
  if (value === "FINISHED" || value === "COMPLETED") return "finished";
  if (value === "DROPPED") return "dropped";
  if (
    value === "ONGOING" ||
    value === "READING" ||
    value === "CONSUMING" ||
    value === "WATCHING" ||
    value === "LISTENING"
  ) {
    return "reading";
  }
  return "want";
}

export function wantLabelForType(type: WorkType | ContentType | string): string {
  const normalized = String(type).toUpperCase();
  if (normalized === "MOVIE") return "Want to watch";
  if (normalized === "MUSIC") return "Want to listen";
  return "Want to read";
}

export function readingLabelForType(
  type: WorkType | ContentType | string,
): string {
  const normalized = String(type).toUpperCase();
  if (normalized === "MOVIE") return "Watching";
  if (normalized === "MUSIC") return "Listening";
  return "Reading";
}

function toMediaType(
  type: WorkType | ContentType | string,
): "BOOK" | "MOVIE" | "MUSIC" {
  const normalized = String(type).toUpperCase();
  if (normalized === "MOVIE" || normalized === "FILM") return "MOVIE";
  if (normalized === "MUSIC") return "MUSIC";
  return "BOOK";
}

/**
 * Single write path for work relationship status.
 * Syncs user media state + memory for AI/library consumers.
 */
export function setWorkStatus(
  identity: WorkStatusIdentity,
  input: SetWorkStatusInput,
): UserMediaState {
  const mediaType = toMediaType(identity.type);
  const canonical = resolveCanonicalWork({
    workId: identity.id,
    title: identity.title,
    creator: identity.creator,
    type: identity.type,
  });
  const workId = resolveCanonicalWorkId({
    workId: identity.id,
    title: identity.title,
    creator: identity.creator,
    type: identity.type,
  });
  const title = canonical?.title ?? identity.title;
  const creator = canonical?.creator ?? identity.creator;
  const normalized = resolveCoverUrl(
    canonical?.coverUrl,
    identity.coverUrl,
    identity.cover,
  );
  const cover = isRemoteCoverUrl(normalized) ? normalized : undefined;
  const endDate =
    input.endDate ??
    (input.status === "finished" ? getDisplayTodayString() : undefined);

  if (input.status === "want") {
    const state = upsertUserMediaState(workId, {
      status: "WANT",
      title,
      creator,
      cover,
      mediaType,
      addedToJournal: false,
      shortReview: input.review,
    });
    syncMemoryFromUserState(workId, state);
    return state;
  }

  if (input.status === "reading") {
    const state = upsertUserMediaState(workId, {
      status: "ONGOING",
      title,
      creator,
      cover,
      mediaType,
      startDate: getDisplayTodayString(),
      addedToJournal: false,
    });
    syncMemoryFromUserState(workId, state);
    return state;
  }

  if (input.status === "dropped") {
    const reason = input.droppedReason?.trim() || undefined;
    const state = upsertUserMediaState(workId, {
      status: "DROPPED",
      title,
      creator,
      cover,
      mediaType,
      droppedReason: reason,
      notes: reason,
      shortReview: input.review,
      endDate: endDate ?? getDisplayTodayString(),
      addedToJournal: false,
    });
    upsertMemory({
      contentId: workId,
      status: "DROPPED",
      note: reason ?? input.review,
      rating: input.rating,
    });
    return state;
  }

  // finished
  const rating = input.rating && input.rating > 0 ? input.rating : undefined;
  const state = upsertUserMediaState(workId, {
    status: "FINISHED",
    title,
    creator,
    cover,
    mediaType,
    rating,
    shortReview: input.review,
    endDate: endDate ?? getDisplayTodayString(),
    addedToJournal: false,
  });
  syncMemoryFromUserState(workId, state);
  return state;
}

export function clearWorkStatus(workId: string) {
  removeUserMediaState(workId);
  removeMemory(workId);
}

/** Compact AI-facing summary of a user's relationship with works. */
export type WorkStatusAiSignal = {
  workId: string;
  title: string;
  type: WorkType;
  status: WorkUserStatus;
  rating?: number;
  review?: string;
  droppedReason?: string;
  liked: boolean;
  finished: boolean;
  abandoned: boolean;
};

export function toWorkStatusAiSignal(work: Work): WorkStatusAiSignal {
  const rating = work.rating;
  return {
    workId: work.id,
    title: work.title,
    type: work.type,
    status: work.userStatus,
    rating,
    review: work.review,
    droppedReason: work.droppedReason,
    liked: Boolean(rating && rating >= 4) || work.userStatus === "finished",
    finished: work.userStatus === "finished",
    abandoned: work.userStatus === "dropped",
  };
}

export function buildWorkStatusAiSignals(works: Work[]): WorkStatusAiSignal[] {
  return works
    .filter((work) => work.userStatus !== "want" || Boolean(work.rating))
    .map(toWorkStatusAiSignal);
}
