export type {
  ExternalRating,
  Work,
  WorkAiInsights,
  WorkEnrichment,
  WorkEnrichmentSimilarWork,
  WorkTimeline,
  WorkType,
  WorkUserState,
  WorkUserStatus,
} from "@/types/work";

export {
  buildTimeline,
  contentToWork,
  libraryItemToWork,
  mediaItemToWork,
  mergeExternalRatings,
  mergeWorks,
  normalizeExternalRatings,
  toContentType,
  toExternalRating,
  toLibraryMediaType,
  toMediaStatus,
  toMediaType,
  toUserMediaStatus,
  toWorkType,
  toWorkUserState,
  workToLibraryItem,
  workToMediaItem,
} from "@/lib/work/work-adapters";

export {
  buildWorks,
  getWorkById,
  listCatalogWorks,
  listWorksByType,
  listWorksByUserState,
} from "@/lib/work/work-repository";

export { useWork, useWorks } from "@/lib/work/use-works";

export {
  buildWorkStatusAiSignals,
  clearWorkStatus,
  getDropReasons,
  readingLabelForType,
  setWorkStatus,
  toWorkStatusAiSignal,
  toWorkUserStatus,
  wantLabelForType,
} from "@/lib/work/work-status";

export {
  createImportedWork,
  IMPORTED_WORK_PLACEHOLDER_COVER,
  openLibraryWorkId,
  type ImportedWorkInput,
} from "@/lib/work/create-imported-work";

export {
  FALLBACK_COVER,
  isRemoteCoverUrl,
  resolveCoverUrl,
} from "@/lib/work/cover-url";

export {
  normalizeIdentityText,
  workIdentityKey,
} from "@/lib/work/work-identity";

export {
  findImportedWorkByIdentity,
  getImportedWorkByExternalId,
  getImportedWorkById,
  listImportedWorks,
  persistImportedWork,
  removeImportedWork,
  useImportedWorkMap,
} from "@/lib/work/imported-work-catalog";

export {
  CONTENT_LAYER,
  isApiBackedSource,
  type ContentLayer,
} from "@/lib/work/content-layers";
