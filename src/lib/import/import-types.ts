export type ImportStep = "UPLOAD" | "MAP" | "REVIEW" | "CONFIRM" | "RESULT";

export type ImportMediaType = "BOOK" | "MOVIE" | "MUSIC";

export type ImportMediaStatus = "WANT" | "ONGOING" | "FINISHED";

export type RatingScaleMode =
  | "5-star"
  | "10-point"
  | "normalized"
  | "none";

export type DateFormatPreference = "YYYY-MM-DD" | "MM/DD/YYYY" | "DD/MM/YYYY";

export type ImportReviewFilter = "all" | "ready" | "attention" | "duplicates";

export type DuplicateResolution = "SKIP" | "MERGE" | "REPLACE";

export interface RawImportRow {
  rowNumber: number;
  values: Record<string, string>;
}

export interface ImportValidationError {
  field: string;
  message: string;
  originalValue?: string;
}

export interface ImportValidationWarning {
  field: string;
  message: string;
}

export interface DuplicateMatch {
  existingMediaId: string;
  existingTitle: string;
  confidence: "EXACT" | "LIKELY";
  resolution: DuplicateResolution;
}

export interface NormalizedImportRow {
  rowNumber: number;
  title: string;
  type?: ImportMediaType;
  creator?: string;
  status?: ImportMediaStatus;
  rating?: number;
  ratingOriginal?: number;
  ratingScale?: number;
  progress?: number;
  startDate?: string;
  endDate?: string;
  shortReview?: string;
  notes?: string;
  cover?: string;
  externalId?: string;
  errors: ImportValidationError[];
  warnings: ImportValidationWarning[];
  ignored: boolean;
  duplicate?: DuplicateMatch;
  resolvedMediaKey?: string;
}

export interface ImportFieldMapping {
  title?: string;
  type?: string;
  creator?: string;
  status?: string;
  rating?: string;
  ratingScale?: string;
  progress?: string;
  startDate?: string;
  endDate?: string;
  shortReview?: string;
  notes?: string;
  cover?: string;
  externalId?: string;
}

export interface ImportFileMeta {
  name: string;
  kind: "csv" | "json";
  size: number;
  rowCount: number;
}

export interface ImportBatch {
  id: string;
  importedAt: string;
  fileName: string;
  fileKind: "csv" | "json";
  createdMediaIds: string[];
  affectedMediaKeys: string[];
  previousUserStates: Record<string, import("@/lib/content/user-media-state").UserMediaState | null>;
  createdJourneyIds: string[];
  createdUserContentIds: string[];
  status: "completed" | "partial";
  importedCount: number;
  skippedCount: number;
  warningCount: number;
}

export interface ImportExecutionResult {
  imported: number;
  skipped: number;
  warnings: number;
  ignored: number;
  errors: Array<{
    row: number;
    title: string;
    errorField: string;
    errorMessage: string;
    originalValue?: string;
  }>;
  batch: ImportBatch;
}

export const IMPORT_LIMITS = {
  maxFileBytes: 10 * 1024 * 1024,
  maxRows: 5000,
  reviewPageSize: 50,
} as const;

export const MUSELOG_FIELDS = [
  { key: "title", label: "Title", required: true },
  { key: "type", label: "Type", required: true },
  { key: "creator", label: "Creator", required: false },
  { key: "status", label: "Status", required: false },
  { key: "rating", label: "Rating", required: false },
  { key: "ratingScale", label: "Rating Scale", required: false },
  { key: "progress", label: "Progress", required: false },
  { key: "startDate", label: "Start Date", required: false },
  { key: "endDate", label: "End Date", required: false },
  { key: "shortReview", label: "Short Review", required: false },
  { key: "notes", label: "Notes", required: false },
  { key: "cover", label: "Cover URL", required: false },
  { key: "externalId", label: "External ID", required: false },
] as const;
