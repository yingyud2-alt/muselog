import type { Work, WorkListQuery, WorkListResult } from "@/services/types/work";

/**
 * Shared contract for book / movie / music remote services.
 * Implementations stay local/mock until API wiring.
 */
export type WorkMediaService = {
  list(query?: WorkListQuery): Promise<WorkListResult>;
  getById(id: string): Promise<Work | null>;
  search(query: string, limit?: number): Promise<Work[]>;
};

export type BookService = WorkMediaService;
export type MovieService = WorkMediaService;
export type MusicService = WorkMediaService;
