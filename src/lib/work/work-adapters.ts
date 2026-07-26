import type { Content, ContentType } from "@/lib/content/types";
import type { LibraryItem, LibraryMediaType } from "@/lib/library/library-types";
import type { UserMediaStatus } from "@/lib/content/user-media-state";
import type { MediaItem, MediaStatus, MediaType } from "@/types/media";
import type {
  Work,
  WorkTimeline,
  WorkType,
  WorkUserStatus,
} from "@/types/work";
import {
  toUserMediaStatusFromWork,
  toWorkUserStatus,
} from "@/lib/work/work-status";

const DEFAULT_COVER = "from-slate-800 via-slate-900 to-black";

export function toWorkType(
  type: ContentType | LibraryMediaType | MediaType | string,
): WorkType {
  const normalized = String(type).toLowerCase();
  if (normalized === "movie") return "movie";
  if (normalized === "music") return "music";
  return "book";
}

export function toContentType(type: WorkType): ContentType {
  if (type === "movie") return "MOVIE";
  if (type === "music") return "MUSIC";
  return "BOOK";
}

export function toLibraryMediaType(type: WorkType): LibraryMediaType {
  return toContentType(type);
}

export function toMediaType(type: WorkType): MediaType {
  return type;
}

/** Map legacy/store statuses → Work.userStatus. */
export function toWorkUserState(
  status: UserMediaStatus | MediaStatus | string,
): WorkUserStatus {
  return toWorkUserStatus(status);
}

export function toUserMediaStatus(
  state: WorkUserStatus,
): Exclude<UserMediaStatus, "NONE"> {
  return toUserMediaStatusFromWork(state);
}

export function toMediaStatus(state: WorkUserStatus): MediaStatus {
  if (state === "want") return "WANT";
  if (state === "finished") return "FINISHED";
  // Journal has no dropped — keep as READING while abandoned in library.
  if (state === "dropped") return "WANT";
  return "READING";
}

function timelineDurationDays(start?: string, end?: string): number | undefined {
  if (!start || !end) return undefined;
  const startMs = Date.parse(start);
  const endMs = Date.parse(end);
  if (Number.isNaN(startMs) || Number.isNaN(endMs)) return undefined;
  return Math.max(1, Math.round((endMs - startMs) / 86_400_000) + 1);
}

export function buildTimeline(
  startDate?: string,
  endDate?: string,
  duration?: number,
): WorkTimeline {
  return {
    startDate,
    endDate,
    duration: duration ?? timelineDurationDays(startDate, endDate),
  };
}

function withStatusFields(
  status: WorkUserStatus,
  partial?: Partial<Work>,
): Pick<
  Work,
  "userStatus" | "userState" | "rating" | "review" | "droppedReason"
> {
  const userStatus = partial?.userStatus ?? partial?.userState ?? status;
  return {
    userStatus,
    userState: userStatus,
    rating: partial?.rating,
    review: partial?.review,
    droppedReason: partial?.droppedReason,
  };
}

/** Catalog content → Work (unarchived default state). */
export function contentToWork(
  content: Content,
  partial?: Partial<Work>,
): Work {
  return {
    id: content.id,
    type: toWorkType(content.type),
    title: content.title,
    creator: content.creator,
    coverUrl: content.cover || DEFAULT_COVER,
    description: content.description,
    genres: [...content.tags],
    ...withStatusFields("want", partial),
    timeline: partial?.timeline ?? {},
    userNotes: partial?.userNotes ?? "",
    moodTags: partial?.moodTags ?? content.tags.slice(0, 4),
    aiInsights: partial?.aiInsights,
    releaseDate: partial?.releaseDate,
    source: partial?.source ?? content.source,
    externalId: partial?.externalId,
    metadata: partial?.metadata,
  };
}

/** Library shelf row → Work. */
export function libraryItemToWork(item: LibraryItem): Work {
  const userStatus = toWorkUserStatus(item.status);
  return {
    id: item.mediaKey,
    type: toWorkType(item.type),
    title: item.title,
    creator: item.creator,
    coverUrl: item.cover || DEFAULT_COVER,
    description: item.shortReview ?? item.notes ?? "",
    genres: [],
    userStatus,
    userState: userStatus,
    timeline: buildTimeline(item.startDate, item.endDate),
    userNotes: item.notes ?? item.shortReview ?? "",
    moodTags: [],
    rating: item.rating,
    review: item.shortReview,
    droppedReason:
      item.status === "DROPPED" ? item.notes ?? item.shortReview : undefined,
  };
}

/** Journal media entry → Work. */
export function mediaItemToWork(item: MediaItem): Work {
  const mediaKey = item.id.replace(/^journal-/, "");
  const userStatus = toWorkUserStatus(item.status);
  return {
    id: mediaKey.startsWith("calendar-") ? item.id : mediaKey,
    type: toWorkType(item.type),
    title: item.title,
    creator: item.creator,
    coverUrl: item.cover || DEFAULT_COVER,
    description: item.note || item.quote || "",
    genres: [...item.tags],
    userStatus,
    userState: userStatus,
    timeline: buildTimeline(
      item.startDate ?? item.date,
      item.endDate,
      item.durationMinutes ?? item.duration,
    ),
    userNotes: item.note || item.notes || "",
    moodTags: [...item.tags],
    rating: item.rating > 0 ? item.rating : undefined,
    review: item.note || undefined,
  };
}

/** Work → LibraryItem for existing UI props (no visual change). */
export function workToLibraryItem(
  work: Work,
  extras?: Partial<LibraryItem>,
): LibraryItem {
  const now = new Date().toISOString();
  const status = work.userStatus ?? work.userState;
  return {
    mediaKey: work.id,
    contentId: work.id.startsWith("bubble-") ? null : work.id,
    title: work.title,
    creator: work.creator,
    cover: work.coverUrl,
    type: toLibraryMediaType(work.type),
    status: toUserMediaStatus(status),
    notes: work.droppedReason ?? work.userNotes ?? undefined,
    shortReview: work.review ?? work.description ?? undefined,
    startDate: work.timeline.startDate,
    endDate: work.timeline.endDate,
    addedToJournal: Boolean(work.timeline.startDate || work.userNotes),
    createdAt: extras?.createdAt ?? now,
    updatedAt: extras?.updatedAt ?? now,
    progress: extras?.progress,
    rating: work.rating ?? extras?.rating,
    ...extras,
  };
}

/** Work → MediaItem for journal UI props (no visual change). */
export function workToMediaItem(
  work: Work,
  extras?: Partial<MediaItem>,
): MediaItem {
  const status = work.userStatus ?? work.userState;
  const date =
    work.timeline.endDate ??
    work.timeline.startDate ??
    extras?.date ??
    new Date().toISOString().slice(0, 10);

  return {
    id: extras?.id ?? `journal-${work.id}`,
    type: toMediaType(work.type),
    title: work.title,
    cover: work.coverUrl,
    creator: work.creator,
    rating: work.rating ?? extras?.rating ?? 0,
    status: toMediaStatus(status),
    date,
    quote: extras?.quote ?? "",
    note: work.review ?? work.userNotes,
    notes: work.userNotes,
    tags: work.moodTags.length > 0 ? work.moodTags : work.genres,
    startDate: work.timeline.startDate ?? date,
    endDate: work.timeline.endDate ?? date,
    duration: work.timeline.duration,
    ...extras,
  };
}

/** Merge preference: later fields win for identity; notes prefer non-empty. */
export function mergeWorks(base: Work, overlay: Partial<Work>): Work {
  const userStatus =
    overlay.userStatus ?? overlay.userState ?? base.userStatus ?? base.userState;
  return {
    ...base,
    ...overlay,
    genres: overlay.genres ?? base.genres,
    moodTags: overlay.moodTags ?? base.moodTags,
    timeline: {
      ...base.timeline,
      ...overlay.timeline,
    },
    userStatus,
    userState: userStatus,
    userNotes: overlay.userNotes?.trim()
      ? overlay.userNotes
      : base.userNotes,
    description: overlay.description?.trim()
      ? overlay.description
      : base.description,
    rating: overlay.rating ?? base.rating,
    review: overlay.review ?? base.review,
    droppedReason: overlay.droppedReason ?? base.droppedReason,
    aiInsights: overlay.aiInsights ?? base.aiInsights,
    source: overlay.source ?? base.source,
    externalId: overlay.externalId ?? base.externalId,
    metadata: overlay.metadata ?? base.metadata,
  };
}
