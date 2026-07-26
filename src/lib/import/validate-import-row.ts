import type {
  DateFormatPreference,
  ImportFieldMapping,
  NormalizedImportRow,
  RatingScaleMode,
  RawImportRow,
} from "@/lib/import/import-types";
import {
  normalizeImportStatus,
  normalizeImportType,
  normalizeProgress,
  normalizeRating,
  parseImportDate,
} from "@/lib/import/normalize-media";

function pickValue(
  row: RawImportRow,
  mapping: ImportFieldMapping,
  key: keyof ImportFieldMapping,
): string | undefined {
  const column = mapping[key];
  if (!column) return undefined;
  const value = row.values[column];
  return value?.trim() ? value.trim() : undefined;
}

export function mapRawRow(
  row: RawImportRow,
  mapping: ImportFieldMapping,
  ratingScaleMode: RatingScaleMode,
  datePreference: DateFormatPreference,
): NormalizedImportRow {
  const title = pickValue(row, mapping, "title") ?? "";
  const typeRaw = pickValue(row, mapping, "type");
  const creator = pickValue(row, mapping, "creator");
  const statusRaw = pickValue(row, mapping, "status");
  const ratingRaw = pickValue(row, mapping, "rating");
  const rowScaleRaw = pickValue(row, mapping, "ratingScale");
  const progressRaw = pickValue(row, mapping, "progress");
  const startRaw = pickValue(row, mapping, "startDate");
  const endRaw = pickValue(row, mapping, "endDate");
  const shortReview = pickValue(row, mapping, "shortReview");
  const notes = pickValue(row, mapping, "notes");
  const cover = pickValue(row, mapping, "cover");
  const externalId = pickValue(row, mapping, "externalId");

  const errors: NormalizedImportRow["errors"] = [];
  const warnings: NormalizedImportRow["warnings"] = [];

  const type = normalizeImportType(typeRaw);
  if (!title) {
    errors.push({ field: "title", message: "Title is required", originalValue: title });
  }
  if (!type) {
    errors.push({
      field: "type",
      message: "Could not recognize type",
      originalValue: typeRaw,
    });
  }

  const status = normalizeImportStatus(statusRaw);
  if (!status) {
    errors.push({
      field: "status",
      message: statusRaw
        ? "Could not recognize status"
        : "Status is required",
      originalValue: statusRaw,
    });
  }

  const rowScale = rowScaleRaw ? Number.parseFloat(rowScaleRaw) : undefined;
  const ratingResult = normalizeRating(ratingRaw, ratingScaleMode, rowScale);
  if (ratingResult.error) {
    errors.push({
      field: "rating",
      message: ratingResult.error,
      originalValue: ratingRaw,
    });
  }

  const progressResult = normalizeProgress(progressRaw);
  if (progressResult.error) {
    errors.push({
      field: "progress",
      message: progressResult.error,
      originalValue: progressRaw,
    });
  }

  const startResult = parseImportDate(startRaw, datePreference);
  if (startResult.error && !startResult.ambiguous) {
    errors.push({
      field: "startDate",
      message: startResult.error,
      originalValue: startRaw,
    });
  }
  if (startResult.ambiguous) {
    errors.push({
      field: "startDate",
      message: "Ambiguous date — choose date format",
      originalValue: startRaw,
    });
  }

  const endResult = parseImportDate(endRaw, datePreference);
  if (endResult.error && !endResult.ambiguous) {
    errors.push({
      field: "endDate",
      message: endResult.error,
      originalValue: endRaw,
    });
  }
  if (endResult.ambiguous) {
    errors.push({
      field: "endDate",
      message: "Ambiguous date — choose date format",
      originalValue: endRaw,
    });
  }

  const startDate = startResult.date;
  const endDate = endResult.date;

  if (startDate && endDate && startDate > endDate) {
    errors.push({
      field: "endDate",
      message: "Start date is after end date",
      originalValue: endRaw,
    });
  }

  if (status === "FINISHED" && endDate && !startDate) {
    warnings.push({
      field: "startDate",
      message: "Only end date provided — start will equal end date",
    });
  }

  const resolvedStatus = status;
  let resolvedProgress = progressResult.progress;

  if (resolvedStatus === "FINISHED" && resolvedProgress === undefined) {
    resolvedProgress = 100;
  }

  if (resolvedStatus === "WANT") {
    resolvedProgress = undefined;
  }

  return {
    rowNumber: row.rowNumber,
    title,
    type,
    creator,
    status: resolvedStatus,
    rating: ratingResult.rating,
    ratingOriginal: ratingResult.original,
    ratingScale: ratingResult.scale,
    progress: resolvedProgress,
    startDate:
      startDate ?? (resolvedStatus === "FINISHED" && endDate ? endDate : undefined),
    endDate,
    shortReview,
    notes,
    cover,
    externalId,
    errors,
    warnings,
    ignored: false,
  };
}

export function remapRows(
  rawRows: RawImportRow[],
  mapping: ImportFieldMapping,
  ratingScaleMode: RatingScaleMode,
  datePreference: DateFormatPreference,
): NormalizedImportRow[] {
  return rawRows.map((row) =>
    mapRawRow(row, mapping, ratingScaleMode, datePreference),
  );
}

export function isRowReady(row: NormalizedImportRow): boolean {
  return !row.ignored && row.errors.length === 0 && Boolean(row.title && row.type);
}

export function rowNeedsAttention(row: NormalizedImportRow): boolean {
  return !row.ignored && row.errors.length > 0;
}
