import type { MovieService } from "@/services/api/media-service-types";
import type { Work, WorkListResult } from "@/services/types/work";

/**
 * TMDB (future).
 * Placeholder only — do not call external APIs yet.
 */
export const movieService: MovieService = {
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
