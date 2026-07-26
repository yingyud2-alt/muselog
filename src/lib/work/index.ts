export type {
  Work,
  WorkAiInsights,
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
  mergeWorks,
  toContentType,
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
  getImportedWorkByExternalId,
  getImportedWorkById,
  listImportedWorks,
  persistImportedWork,
  removeImportedWork,
  useImportedWorkMap,
} from "@/lib/work/imported-work-catalog";
