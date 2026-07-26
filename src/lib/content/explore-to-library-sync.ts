import type { Memory } from "@/lib/content/types";
import {
  removeUserMediaState,
  upsertUserMediaState,
  type UserMediaStatus,
} from "@/lib/content/user-media-state";

function memoryStatusToUser(status: Memory["status"]): UserMediaStatus {
  if (status === "WANT") return "WANT";
  if (status === "READING") return "ONGOING";
  if (status === "COMPLETED") return "FINISHED";
  if (status === "DROPPED") return "DROPPED";
  return "NONE";
}

export function syncExploreMemoryToUserState(memory: Memory): void {
  const status = memoryStatusToUser(memory.status);

  if (status === "NONE") {
    removeUserMediaState(memory.contentId);
    return;
  }

  upsertUserMediaState(memory.contentId, {
    status,
    rating: memory.rating,
    shortReview: memory.note,
    addedToJournal: status !== "WANT",
  });
}

export function syncExploreMemoryRemoval(contentId: string): void {
  removeUserMediaState(contentId);
}
