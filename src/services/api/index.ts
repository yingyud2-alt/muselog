export {
  bookService,
  buildOpenLibraryCoverUrl,
  enrichOpenLibraryWorkDescription,
  enrichOpenLibraryWorks,
  fetchOpenLibrarySearch,
  getBooksByCategory,
  getExploreBootstrapBooks,
  getOpenLibraryApiUrl,
  getPopularBooks,
  getTrendingBooks,
  mapOpenLibraryDocToWork,
  OPEN_LIBRARY_SOURCE,
  OpenLibraryFetchError,
  searchBooks,
  type OpenLibrarySearchDoc,
} from "@/services/api/book-service";
export { movieService } from "@/services/api/movie-service";
export { musicService } from "@/services/api/music-service";
export { aiService } from "@/services/api/ai-service";
export type { AiService } from "@/services/api/ai-service";
export type {
  BookService,
  MovieService,
  MusicService,
  WorkMediaService,
} from "@/services/api/media-service-types";
