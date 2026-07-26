import type { MusicService } from "@/services/api/media-service-types";
import type { Work, WorkListResult } from "@/services/types/work";

/**
 * Spotify / MusicBrainz (future).
 * Placeholder only — do not call external APIs yet.
 */
export const musicService: MusicService = {
  async list(): Promise<WorkListResult> {
    return { items: [] };
  },

  async getById(): Promise<Work | null> {
    return null;
  },

  async search(): Promise<Work[]> {
    return [];
  },
};
