"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  Copy,
  Download,
  FileJson,
  FileSpreadsheet,
  RotateCcw,
  Trash2,
  Upload,
} from "lucide-react";

import { ImportStepIndicator } from "@/components/import/import-step-indicator";
import { MemoryCover } from "@/components/calendar/memory-cover";
import { detectFieldMapping } from "@/lib/import/field-detection";
import { detectDuplicates } from "@/lib/import/detect-duplicates";
import {
  downloadCsvTemplate,
  downloadErrorReport,
  formatFileSize,
  JSON_EXAMPLE,
} from "@/lib/import/download-utils";
import { executeImport } from "@/lib/import/execute-import";
import {
  getImportHistory,
  undoLastImportBatch,
  useImportHistory,
} from "@/lib/import/import-batch-store";
import type {
  DateFormatPreference,
  DuplicateResolution,
  ImportFieldMapping,
  ImportFileMeta,
  ImportMediaStatus,
  ImportMediaType,
  ImportReviewFilter,
  ImportStep,
  NormalizedImportRow,
  RatingScaleMode,
  RawImportRow,
} from "@/lib/import/import-types";
import { IMPORT_LIMITS, MUSELOG_FIELDS } from "@/lib/import/import-types";
import { parseCsv } from "@/lib/import/parse-csv";
import { parseImportJson } from "@/lib/import/parse-json";
import {
  isRowReady,
  mapRawRow,
  remapRows,
  rowNeedsAttention,
} from "@/lib/import/validate-import-row";
import { MOBILE_NAV_CLEARANCE } from "@/lib/mobile/nav-items";
import { cn } from "@/lib/utils";

function detectFileKind(name: string, text: string): "csv" | "json" {
  if (name.endsWith(".json")) return "json";
  if (name.endsWith(".csv")) return "csv";
  const trimmed = text.trim();
  if (trimmed.startsWith("[") || trimmed.startsWith("{")) return "json";
  return "csv";
}

function rawRowsFromText(text: string, kind: "csv" | "json"): {
  ok: true;
  headers: string[];
  rows: RawImportRow[];
} | { ok: false; message: string } {
  if (kind === "json") {
    const parsed = parseImportJson(text);
    if (!parsed.ok) return parsed;
    const headers = Array.from(
      new Set(parsed.rows.flatMap((row) => Object.keys(row.values))),
    );
    return { ok: true, headers, rows: parsed.rows };
  }

  const parsed = parseCsv(text);
  if (!parsed.ok) return parsed;
  return {
    ok: true,
    headers: parsed.headers,
    rows: parsed.rows.map((values, index) => ({
      rowNumber: index + 2,
      values,
    })),
  };
}

function computeReviewStats(rows: NormalizedImportRow[]) {
  const total = rows.length;
  const ignored = rows.filter((row) => row.ignored).length;
  const ready = rows.filter((row) => isRowReady(row)).length;
  const attention = rows.filter((row) => rowNeedsAttention(row)).length;
  const duplicates = rows.filter(
    (row) => !row.ignored && row.duplicate,
  ).length;
  return { total, ready, attention, duplicates, ignored };
}

function filterReviewRows(
  rows: NormalizedImportRow[],
  filter: ImportReviewFilter,
): NormalizedImportRow[] {
  if (filter === "ready") return rows.filter((row) => isRowReady(row));
  if (filter === "attention") return rows.filter((row) => rowNeedsAttention(row));
  if (filter === "duplicates") {
    return rows.filter((row) => !row.ignored && Boolean(row.duplicate));
  }
  return rows;
}

function ImportHistorySection() {
  const history = useImportHistory();

  if (history.length === 0) return null;

  return (
    <section className="mt-12 border-t border-white/[0.06] pt-8">
      <h2 className="text-sm font-medium text-white/70">Recent imports</h2>
      <ul className="mt-4 space-y-2">
        {history.slice(0, 5).map((batch) => (
          <li
            key={batch.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-sm"
          >
            <div>
              <p className="text-white/78">
                {new Date(batch.importedAt).toLocaleDateString(undefined, {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
              <p className="text-xs text-white/40">
                {batch.importedCount} titles · {batch.fileKind.toUpperCase()} ·{" "}
                {batch.fileName}
              </p>
            </div>
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 text-[11px] uppercase tracking-wide",
                batch.status === "completed"
                  ? "bg-teal-500/10 text-teal-300/70"
                  : "bg-amber-500/10 text-amber-300/70",
              )}
            >
              {batch.status === "completed" ? "Completed" : "Partial"}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function revalidateEditedRow(
  row: NormalizedImportRow,
  ratingScaleMode: RatingScaleMode,
  datePreference: DateFormatPreference,
): NormalizedImportRow {
  const validated = mapRawRow(
    {
      rowNumber: row.rowNumber,
      values: {
        title: row.title,
        type: row.type ?? "",
        creator: row.creator ?? "",
        status: row.status ?? "",
        rating:
          row.ratingOriginal?.toString() ?? row.rating?.toString() ?? "",
        progress: row.progress?.toString() ?? "",
        startDate: row.startDate ?? "",
        endDate: row.endDate ?? "",
        shortReview: row.shortReview ?? "",
        notes: row.notes ?? "",
        cover: row.cover ?? "",
        externalId: row.externalId ?? "",
      },
    },
    {
      title: "title",
      type: "type",
      creator: "creator",
      status: "status",
      rating: "rating",
      progress: "progress",
      startDate: "startDate",
      endDate: "endDate",
      shortReview: "shortReview",
      notes: "notes",
      cover: "cover",
      externalId: "externalId",
    },
    ratingScaleMode,
    datePreference,
  );

  return {
    ...validated,
    ignored: row.ignored,
    cover: row.cover ?? validated.cover,
    externalId: row.externalId ?? validated.externalId,
    duplicate: row.duplicate,
  };
}

export function ImportCenter() {
  const [step, setStep] = useState<ImportStep>("UPLOAD");
  const [fileMeta, setFileMeta] = useState<ImportFileMeta | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<RawImportRow[]>([]);
  const [mapping, setMapping] = useState<ImportFieldMapping>({});
  const [ratingScaleMode, setRatingScaleMode] =
    useState<RatingScaleMode>("5-star");
  const [datePreference, setDatePreference] =
    useState<DateFormatPreference>("YYYY-MM-DD");
  const [normalizedRows, setNormalizedRows] = useState<NormalizedImportRow[]>(
    [],
  );
  const [reviewFilter, setReviewFilter] = useState<ImportReviewFilter>("all");
  const [reviewPage, setReviewPage] = useState(0);
  const [parseError, setParseError] = useState<string | null>(null);
  const [pasteText, setPasteText] = useState("");
  const [showPaste, setShowPaste] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [importProgress, setImportProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);
  const [result, setResult] = useState<
    import("@/lib/import/import-types").ImportExecutionResult | null
  >(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [copiedExample, setCopiedExample] = useState(false);

  const recomputeRows = useCallback(
    (
      rows: RawImportRow[],
      nextMapping: ImportFieldMapping,
      scale: RatingScaleMode,
      datePref: DateFormatPreference,
    ) => {
      const mapped = remapRows(rows, nextMapping, scale, datePref);
      setNormalizedRows(detectDuplicates(mapped));
    },
    [],
  );

  const loadParsed = useCallback(
    (
      meta: ImportFileMeta,
      nextHeaders: string[],
      rows: RawImportRow[],
    ) => {
      if (rows.length > IMPORT_LIMITS.maxRows) {
        setParseError(
          `Too many records (${rows.length}). Maximum is ${IMPORT_LIMITS.maxRows}.`,
        );
        return;
      }

      const detected = detectFieldMapping(nextHeaders);
      setFileMeta(meta);
      setHeaders(nextHeaders);
      setRawRows(rows);
      setMapping(detected);
      setParseError(null);
      recomputeRows(rows, detected, ratingScaleMode, datePreference);
      setStep("MAP");
      setReviewPage(0);
    },
    [datePreference, ratingScaleMode, recomputeRows],
  );

  const handleFile = useCallback(
    async (file: File) => {
      if (file.size > IMPORT_LIMITS.maxFileBytes) {
        setParseError(
          `File exceeds ${formatFileSize(IMPORT_LIMITS.maxFileBytes)} limit.`,
        );
        return;
      }

      const text = await file.text();
      const kind = detectFileKind(file.name, text);
      const parsed = rawRowsFromText(text, kind);
      if (!parsed.ok) {
        setParseError(parsed.message);
        return;
      }

      loadParsed(
        {
          name: file.name,
          kind,
          size: file.size,
          rowCount: parsed.rows.length,
        },
        parsed.headers,
        parsed.rows,
      );
    },
    [loadParsed],
  );

  const handlePasteSubmit = useCallback(() => {
    const trimmed = pasteText.trim();
    if (!trimmed) {
      setParseError("Paste CSV or JSON text first.");
      return;
    }
    const kind = detectFileKind("pasted.txt", trimmed);
    const parsed = rawRowsFromText(trimmed, kind);
    if (!parsed.ok) {
      setParseError(parsed.message);
      return;
    }

    loadParsed(
      {
        name: kind === "json" ? "pasted.json" : "pasted.csv",
        kind,
        size: new Blob([trimmed]).size,
        rowCount: parsed.rows.length,
      },
      parsed.headers,
      parsed.rows,
    );
  }, [loadParsed, pasteText]);

  const stats = useMemo(
    () => computeReviewStats(normalizedRows),
    [normalizedRows],
  );

  const importableRows = useMemo(
    () => normalizedRows.filter((row) => isRowReady(row)),
    [normalizedRows],
  );

  const confirmStats = useMemo(() => {
    const books = importableRows.filter((row) => row.type === "BOOK").length;
    const movies = importableRows.filter((row) => row.type === "MOVIE").length;
    const music = importableRows.filter((row) => row.type === "MUSIC").length;
    const want = importableRows.filter((row) => row.status === "WANT").length;
    const ongoing = importableRows.filter((row) => row.status === "ONGOING").length;
    const finished = importableRows.filter(
      (row) => row.status === "FINISHED",
    ).length;
    const skipped = normalizedRows.filter(
      (row) => row.duplicate?.resolution === "SKIP" && isRowReady(row),
    ).length;
    return { books, movies, music, want, ongoing, finished, skipped };
  }, [importableRows, normalizedRows]);

  const filteredRows = useMemo(
    () => filterReviewRows(normalizedRows, reviewFilter),
    [normalizedRows, reviewFilter],
  );

  const pageSize = IMPORT_LIMITS.reviewPageSize;
  const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const pagedRows = filteredRows.slice(
    reviewPage * pageSize,
    reviewPage * pageSize + pageSize,
  );

  const updateRow = (rowNumber: number, patch: Partial<NormalizedImportRow>) => {
    setNormalizedRows((prev) => {
      const next = prev.map((row) => {
        if (row.rowNumber !== rowNumber) return row;
        return { ...row, ...patch };
      });
      const revalidated = next.map((row) => {
        if (row.rowNumber !== rowNumber) return row;
        if (patch.ignored !== undefined && patch.ignored) {
          return { ...row, ignored: true, errors: [] };
        }
        return revalidateEditedRow(row, ratingScaleMode, datePreference);
      });
      return detectDuplicates(revalidated);
    });
  };

  const handleMappingChange = (key: keyof ImportFieldMapping, value: string) => {
    const next = { ...mapping, [key]: value || undefined };
    setMapping(next);
    recomputeRows(rawRows, next, ratingScaleMode, datePreference);
  };

  const handleScaleChange = (scale: RatingScaleMode) => {
    setRatingScaleMode(scale);
    recomputeRows(rawRows, mapping, scale, datePreference);
  };

  const handleDatePrefChange = (pref: DateFormatPreference) => {
    setDatePreference(pref);
    recomputeRows(rawRows, mapping, ratingScaleMode, pref);
  };

  const handleDuplicateResolution = (
    rowNumber: number,
    resolution: DuplicateResolution,
  ) => {
    setNormalizedRows((prev) =>
      detectDuplicates(
        prev.map((row) =>
          row.rowNumber === rowNumber && row.duplicate
            ? { ...row, duplicate: { ...row.duplicate, resolution } }
            : row,
        ),
      ),
    );
  };

  const runImport = async () => {
    if (!fileMeta) return;
    setImportError(null);
    setImportProgress({ current: 0, total: importableRows.length });

    try {
      const execution = await executeImport(
        normalizedRows,
        fileMeta.name,
        fileMeta.kind,
        (current, total) => setImportProgress({ current, total }),
      );
      setResult(execution);
      setStep("RESULT");
    } catch (error) {
      if (error instanceof Error && error.message === "STORAGE_QUOTA_EXCEEDED") {
        setImportError(
          "There isn't enough local storage to import this library.",
        );
      } else {
        setImportError(
          error instanceof Error ? error.message : "Import failed unexpectedly.",
        );
      }
    } finally {
      setImportProgress(null);
    }
  };

  const resetUpload = () => {
    setFileMeta(null);
    setHeaders([]);
    setRawRows([]);
    setMapping({});
    setNormalizedRows([]);
    setParseError(null);
    setPasteText("");
    setStep("UPLOAD");
    setResult(null);
    setImportError(null);
  };

  return (
    <div
      className="mx-auto max-w-[1100px] px-5 pt-[calc(env(safe-area-inset-top)+20px)] md:px-8 md:py-10"
      style={{ paddingBottom: MOBILE_NAV_CLEARANCE }}
    >
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <Link
            href="/library"
            className="inline-flex items-center gap-1.5 text-xs text-white/40 hover:text-white/60"
          >
            <ArrowLeft className="size-3.5" />
            Library
          </Link>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-white/92 md:text-3xl">
            Import your library
          </h1>
          <p className="mt-2 max-w-xl text-sm text-white/48">
            Bring your books, films and music into MuseLog.
          </p>
        </div>
      </div>

      {step !== "RESULT" && (
        <div className="mb-8">
          <ImportStepIndicator current={step} />
        </div>
      )}

      {step === "UPLOAD" && (
        <section className="space-y-6">
          <div
            onDragOver={(event) => {
              event.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragOver(false);
              const file = event.dataTransfer.files[0];
              if (file) void handleFile(file);
            }}
            className={cn(
              "rounded-2xl border bg-white/[0.03] p-8 transition-colors",
              dragOver ? "border-teal-400/30" : "border-white/[0.08]",
            )}
          >
            {!fileMeta ? (
              <div className="flex flex-col items-center text-center">
                <div className="flex size-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
                  <Upload className="size-5 text-white/50" />
                </div>
                <p className="mt-4 text-sm text-white/70">
                  Drop a CSV or JSON file here, or choose one from your device.
                </p>
                <p className="mt-2 text-xs text-white/38">
                  Your file stays on this device. Max{" "}
                  {formatFileSize(IMPORT_LIMITS.maxFileBytes)} · up to{" "}
                  {IMPORT_LIMITS.maxRows.toLocaleString()} records.
                </p>
                <label className="mt-6 cursor-pointer rounded-xl border border-white/12 bg-white/[0.05] px-4 py-2.5 text-sm text-white/78 hover:bg-white/[0.08]">
                  Choose file
                  <input
                    type="file"
                    accept=".csv,.json,text/csv,application/json"
                    className="sr-only"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) void handleFile(file);
                    }}
                  />
                </label>
              </div>
            ) : (
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  {fileMeta.kind === "json" ? (
                    <FileJson className="mt-0.5 size-5 text-teal-300/60" />
                  ) : (
                    <FileSpreadsheet className="mt-0.5 size-5 text-teal-300/60" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-white/85">
                      {fileMeta.name}
                    </p>
                    <p className="mt-1 text-xs text-white/42">
                      {fileMeta.kind.toUpperCase()} · {formatFileSize(fileMeta.size)} ·{" "}
                      {fileMeta.rowCount} records
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <label className="cursor-pointer rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/65 hover:bg-white/[0.05]">
                    Replace file
                    <input
                      type="file"
                      accept=".csv,.json,text/csv,application/json"
                      className="sr-only"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) void handleFile(file);
                      }}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={resetUpload}
                    className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/65 hover:bg-white/[0.05]"
                  >
                    <Trash2 className="size-3.5" />
                    Remove
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
            <button
              type="button"
              onClick={() => setShowPaste((value) => !value)}
              className="text-sm text-white/65 hover:text-white/85"
            >
              {showPaste ? "Hide paste panel" : "Paste CSV / JSON instead"}
            </button>
            {showPaste && (
              <div className="mt-4 space-y-3">
                <textarea
                  value={pasteText}
                  onChange={(event) => setPasteText(event.target.value)}
                  rows={6}
                  placeholder="Paste CSV or JSON array here..."
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white/80 placeholder:text-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/15"
                />
                <button
                  type="button"
                  onClick={handlePasteSubmit}
                  className="rounded-xl border border-white/12 bg-white/[0.05] px-4 py-2 text-sm text-white/78 hover:bg-white/[0.08]"
                >
                  Parse pasted text
                </button>
              </div>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
              <h3 className="text-sm font-medium text-white/75">
                Download CSV template
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-white/42">
                Fields: title, type, creator, status, rating, ratingScale,
                progress, startDate, endDate, shortReview, notes, cover
              </p>
              <button
                type="button"
                onClick={downloadCsvTemplate}
                className="mt-4 inline-flex items-center gap-2 text-sm text-teal-300/75 hover:text-teal-300"
              >
                <Download className="size-4" />
                Download template
              </button>
            </div>
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
              <h3 className="text-sm font-medium text-white/75">
                JSON example
              </h3>
              <p className="mt-2 text-xs text-white/42">
                Array of objects with the same fields as the CSV template.
              </p>
              <button
                type="button"
                onClick={async () => {
                  await navigator.clipboard.writeText(JSON_EXAMPLE);
                  setCopiedExample(true);
                  setTimeout(() => setCopiedExample(false), 2000);
                }}
                className="mt-4 inline-flex items-center gap-2 text-sm text-teal-300/75 hover:text-teal-300"
              >
                {copiedExample ? (
                  <Check className="size-4" />
                ) : (
                  <Copy className="size-4" />
                )}
                {copiedExample ? "Copied" : "Copy JSON example"}
              </button>
            </div>
          </div>

          {parseError && (
            <p className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-200/80">
              {parseError}
            </p>
          )}

          {fileMeta && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setStep("MAP")}
                className="rounded-xl bg-teal-500/15 px-5 py-2.5 text-sm font-medium text-teal-200/90 hover:bg-teal-500/20"
              >
                Continue to field mapping
              </button>
            </div>
          )}
        </section>
      )}

      {step === "MAP" && (
        <section className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            {MUSELOG_FIELDS.map((field) => (
              <label key={field.key} className="block">
                <span className="text-xs text-white/45">
                  {field.label}
                  {field.required ? " *" : ""}
                </span>
                <select
                  value={mapping[field.key as keyof ImportFieldMapping] ?? ""}
                  onChange={(event) =>
                    handleMappingChange(
                      field.key as keyof ImportFieldMapping,
                      event.target.value,
                    )
                  }
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white/78"
                >
                  <option value="" className="bg-[#121820]">
                    — Not mapped —
                  </option>
                  {headers.map((header) => (
                    <option key={header} value={header} className="bg-[#121820]">
                      {header}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="text-xs text-white/45">Rating scale</span>
              <select
                value={ratingScaleMode}
                onChange={(event) =>
                  handleScaleChange(event.target.value as RatingScaleMode)
                }
                className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white/78"
              >
                <option value="5-star" className="bg-[#121820]">
                  5-star scale
                </option>
                <option value="10-point" className="bg-[#121820]">
                  10-point scale
                </option>
                <option value="normalized" className="bg-[#121820]">
                  Already normalized
                </option>
                <option value="none" className="bg-[#121820]">
                  No rating
                </option>
              </select>
            </label>
            <label className="block">
              <span className="text-xs text-white/45">Ambiguous date format</span>
              <select
                value={datePreference}
                onChange={(event) =>
                  handleDatePrefChange(
                    event.target.value as DateFormatPreference,
                  )
                }
                className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white/78"
              >
                <option value="YYYY-MM-DD" className="bg-[#121820]">
                  YYYY-MM-DD (ISO)
                </option>
                <option value="MM/DD/YYYY" className="bg-[#121820]">
                  MM/DD/YYYY
                </option>
                <option value="DD/MM/YYYY" className="bg-[#121820]">
                  DD/MM/YYYY
                </option>
              </select>
            </label>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setStep("UPLOAD")}
              className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white/65"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => {
                recomputeRows(rawRows, mapping, ratingScaleMode, datePreference);
                setStep("REVIEW");
              }}
              disabled={!mapping.title || !mapping.type}
              className="rounded-xl bg-teal-500/15 px-5 py-2.5 text-sm font-medium text-teal-200/90 hover:bg-teal-500/20 disabled:opacity-40"
            >
              Continue to review
            </button>
          </div>
        </section>
      )}

      {step === "REVIEW" && (
        <section className="space-y-5">
          <div className="flex flex-wrap gap-3 text-sm text-white/55">
            <span>{stats.total} records found</span>
            <span>{stats.ready} ready to import</span>
            <span>{stats.attention} need attention</span>
            <span>{stats.duplicates} duplicates</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {(
              [
                ["all", "All"],
                ["ready", "Ready"],
                ["attention", "Needs attention"],
                ["duplicates", "Duplicates"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setReviewFilter(id);
                  setReviewPage(0);
                }}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs",
                  reviewFilter === id
                    ? "border-teal-400/25 bg-teal-500/10 text-teal-200/85"
                    : "border-white/10 text-white/50",
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="hidden overflow-x-auto rounded-2xl border border-white/[0.06] md:block">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-white/[0.06] text-xs uppercase tracking-wide text-white/35">
                <tr>
                  <th className="px-3 py-2">Valid</th>
                  <th className="px-3 py-2">Cover</th>
                  <th className="px-3 py-2">Title</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Creator</th>
                  <th className="px-3 py-2">User status</th>
                  <th className="px-3 py-2">Rating</th>
                  <th className="px-3 py-2">Progress</th>
                  <th className="px-3 py-2">Dates</th>
                  <th className="px-3 py-2">Duplicate</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pagedRows.map((row) => (
                  <ReviewRowDesktop
                    key={row.rowNumber}
                    row={row}
                    onUpdate={updateRow}
                    onDuplicate={handleDuplicateResolution}
                  />
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 md:hidden">
            {pagedRows.map((row) => (
              <ReviewRowMobile
                key={row.rowNumber}
                row={row}
                onUpdate={updateRow}
                onDuplicate={handleDuplicateResolution}
              />
            ))}
          </div>

          {pageCount > 1 && (
            <div className="flex items-center justify-between text-sm text-white/50">
              <span>
                Page {reviewPage + 1} of {pageCount}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={reviewPage === 0}
                  onClick={() => setReviewPage((value) => value - 1)}
                  className="rounded-lg border border-white/10 px-3 py-1 disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={reviewPage >= pageCount - 1}
                  onClick={() => setReviewPage((value) => value + 1)}
                  className="rounded-lg border border-white/10 px-3 py-1 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setStep("MAP")}
              className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white/65"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => setStep("CONFIRM")}
              className="rounded-xl bg-teal-500/15 px-5 py-2.5 text-sm font-medium text-teal-200/90 hover:bg-teal-500/20"
            >
              Continue
            </button>
          </div>
        </section>
      )}

      {step === "CONFIRM" && (
        <section className="space-y-6">
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
            <h2 className="text-lg font-medium text-white/85">
              Ready to import {importableRows.length} titles
            </h2>
            <dl className="mt-4 grid gap-2 text-sm text-white/55 sm:grid-cols-2">
              <div>Books: {confirmStats.books}</div>
              <div>Movies: {confirmStats.movies}</div>
              <div>Music: {confirmStats.music}</div>
              <div>Want: {confirmStats.want}</div>
              <div>In progress: {confirmStats.ongoing}</div>
              <div>Finished: {confirmStats.finished}</div>
              <div>Duplicates skipped: {confirmStats.skipped}</div>
              <div>Rows ignored: {stats.ignored}</div>
            </dl>
          </div>

          {importProgress && (
            <p className="text-sm text-white/55">
              Importing {importProgress.current} of {importProgress.total}...
            </p>
          )}

          {importError && (
            <p className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-200/80">
              {importError}
            </p>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setStep("REVIEW")}
              className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white/65"
            >
              Back to review
            </button>
            <button
              type="button"
              disabled={importableRows.length === 0 || importProgress !== null}
              onClick={() => void runImport()}
              className="rounded-xl bg-teal-500/15 px-5 py-2.5 text-sm font-medium text-teal-200/90 hover:bg-teal-500/20 disabled:opacity-40"
            >
              Import {importableRows.length} titles
            </button>
          </div>
        </section>
      )}

      {step === "RESULT" && result && (
        <section className="space-y-6">
          <div className="rounded-2xl border border-teal-400/15 bg-teal-500/5 p-6">
            <h2 className="text-lg font-medium text-teal-100/90">
              Import complete
            </h2>
            <p className="mt-2 text-sm text-white/60">
              {result.imported} titles added · {result.skipped} duplicates skipped
              · {result.warnings} records imported with warnings · {result.ignored}{" "}
              rows ignored
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/library"
              className="rounded-xl bg-teal-500/15 px-5 py-2.5 text-sm font-medium text-teal-200/90 hover:bg-teal-500/20"
            >
              View Library
            </Link>
            <Link
              href="/calendar"
              className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-white/70"
            >
              View Journal
            </Link>
            {result.errors.length > 0 && (
              <button
                type="button"
                onClick={() => downloadErrorReport(result)}
                className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-white/70"
              >
                Download error report
              </button>
            )}
            {getImportHistory().length > 0 && (
              <button
                type="button"
                onClick={() => {
                  undoLastImportBatch();
                  resetUpload();
                }}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-white/70"
              >
                <RotateCcw className="size-4" />
                Undo this import
              </button>
            )}
            <button
              type="button"
              onClick={resetUpload}
              className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-white/70"
            >
              Import another file
            </button>
          </div>
        </section>
      )}

      {step !== "RESULT" && <ImportHistorySection />}
    </div>
  );
}

function RowStatusBadge({ row }: { row: NormalizedImportRow }) {
  if (row.ignored) {
    return (
      <span className="text-xs text-white/35">Ignored</span>
    );
  }
  if (isRowReady(row)) {
    return <Check className="size-4 text-teal-300/70" aria-label="Ready" />;
  }
  return (
    <AlertTriangle
      className="size-4 text-amber-300/60"
      aria-label="Needs attention"
    />
  );
}

function RatingDisplay({ row }: { row: NormalizedImportRow }) {
  if (row.rating === undefined) return <span className="text-white/30">—</span>;
  if (row.ratingScale === 10 && row.ratingOriginal !== undefined) {
    return (
      <span>
        {row.ratingOriginal} / 10 → {row.rating} / 5
      </span>
    );
  }
  return <span>{row.rating} / 5</span>;
}

function DuplicateControls({
  row,
  onDuplicate,
}: {
  row: NormalizedImportRow;
  onDuplicate: (rowNumber: number, resolution: DuplicateResolution) => void;
}) {
  if (!row.duplicate) return <span className="text-white/30">—</span>;

  return (
    <div className="space-y-1">
      <p className="text-xs text-amber-200/65">
        Already in Library: {row.duplicate.existingTitle}
      </p>
      <select
        value={row.duplicate.resolution}
        onChange={(event) =>
          onDuplicate(row.rowNumber, event.target.value as DuplicateResolution)
        }
        className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1 text-xs text-white/75"
      >
        <option value="SKIP" className="bg-[#121820]">
          Skip
        </option>
        <option value="MERGE" className="bg-[#121820]">
          Merge
        </option>
        <option value="REPLACE" className="bg-[#121820]">
          Replace
        </option>
      </select>
    </div>
  );
}

function ReviewRowDesktop({
  row,
  onUpdate,
  onDuplicate,
}: {
  row: NormalizedImportRow;
  onUpdate: (rowNumber: number, patch: Partial<NormalizedImportRow>) => void;
  onDuplicate: (rowNumber: number, resolution: DuplicateResolution) => void;
}) {
  const hasError = rowNeedsAttention(row);

  return (
    <tr
      className={cn(
        "border-b border-white/[0.04]",
        hasError && "bg-amber-500/[0.03]",
      )}
    >
      <td className="px-3 py-2">
        <RowStatusBadge row={row} />
      </td>
      <td className="px-3 py-2">
        <MemoryCover
          cover={row.cover?.startsWith("http") ? row.cover : "from-slate-800 via-slate-900 to-black"}
          title={row.title}
          className="w-8 rounded-md"
        />
      </td>
      <td className="px-3 py-2">
        <input
          value={row.title}
          onChange={(event) =>
            onUpdate(row.rowNumber, { title: event.target.value })
          }
          className="w-full min-w-[120px] rounded border border-white/10 bg-transparent px-2 py-1 text-white/80"
        />
      </td>
      <td className="px-3 py-2">
        <select
          value={row.type ?? ""}
          onChange={(event) =>
            onUpdate(row.rowNumber, {
              type: event.target.value as ImportMediaType,
            })
          }
          className="rounded border border-white/10 bg-white/[0.04] px-2 py-1 text-xs"
        >
          <option value="">—</option>
          <option value="BOOK">Book</option>
          <option value="MOVIE">Movie</option>
          <option value="MUSIC">Music</option>
        </select>
      </td>
      <td className="px-3 py-2">
        <input
          value={row.creator ?? ""}
          onChange={(event) =>
            onUpdate(row.rowNumber, { creator: event.target.value })
          }
          className="w-full min-w-[100px] rounded border border-white/10 bg-transparent px-2 py-1 text-white/80"
        />
      </td>
      <td className="px-3 py-2">
        <select
          value={row.status ?? ""}
          onChange={(event) =>
            onUpdate(row.rowNumber, {
              status: event.target.value as ImportMediaStatus,
            })
          }
          className="rounded border border-white/10 bg-white/[0.04] px-2 py-1 text-xs"
        >
          <option value="">—</option>
          <option value="WANT">Want</option>
          <option value="ONGOING">Ongoing</option>
          <option value="FINISHED">Finished</option>
        </select>
      </td>
      <td className="px-3 py-2 text-xs text-white/60">
        <RatingDisplay row={row} />
      </td>
      <td className="px-3 py-2">
        <input
          value={row.progress?.toString() ?? ""}
          onChange={(event) =>
            onUpdate(row.rowNumber, {
              progress: event.target.value
                ? Number.parseFloat(event.target.value)
                : undefined,
            })
          }
          className="w-16 rounded border border-white/10 bg-transparent px-2 py-1 text-xs text-white/80"
        />
      </td>
      <td className="px-3 py-2 text-xs text-white/50">
        {row.startDate ?? "—"} → {row.endDate ?? "—"}
      </td>
      <td className="px-3 py-2">
        <DuplicateControls row={row} onDuplicate={onDuplicate} />
      </td>
      <td className="px-3 py-2">
        <button
          type="button"
          onClick={() => onUpdate(row.rowNumber, { ignored: !row.ignored })}
          className="text-xs text-white/45 hover:text-white/70"
        >
          {row.ignored ? "Include" : "Ignore"}
        </button>
      </td>
    </tr>
  );
}

function ReviewRowMobile({
  row,
  onUpdate,
  onDuplicate,
}: {
  row: NormalizedImportRow;
  onUpdate: (rowNumber: number, patch: Partial<NormalizedImportRow>) => void;
  onDuplicate: (rowNumber: number, resolution: DuplicateResolution) => void;
}) {
  const [open, setOpen] = useState(false);
  const hasError = rowNeedsAttention(row);

  return (
    <div
      className={cn(
        "rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4",
        hasError && "border-amber-500/15",
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-start gap-3 text-left"
      >
        <MemoryCover
          cover={row.cover?.startsWith("http") ? row.cover : "from-slate-800 via-slate-900 to-black"}
          title={row.title}
          className="w-10 shrink-0 rounded-lg"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <RowStatusBadge row={row} />
            <p className="truncate text-sm font-medium text-white/85">
              {row.title || "Untitled"}
            </p>
          </div>
          <p className="mt-1 text-xs text-white/42">
            {row.type ?? "—"} · {row.status ?? "—"}
          </p>
        </div>
      </button>

      {open && (
        <div className="mt-4 space-y-3 border-t border-white/[0.06] pt-4">
          <label className="block text-xs text-white/45">
            Title
            <input
              value={row.title}
              onChange={(event) =>
                onUpdate(row.rowNumber, { title: event.target.value })
              }
              className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white/80"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs text-white/45">
              Type
              <select
                value={row.type ?? ""}
                onChange={(event) =>
                  onUpdate(row.rowNumber, {
                    type: event.target.value as ImportMediaType,
                  })
                }
                className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.04] px-2 py-2 text-sm"
              >
                <option value="">—</option>
                <option value="BOOK">Book</option>
                <option value="MOVIE">Movie</option>
                <option value="MUSIC">Music</option>
              </select>
            </label>
            <label className="block text-xs text-white/45">
              Status
              <select
                value={row.status ?? ""}
                onChange={(event) =>
                  onUpdate(row.rowNumber, {
                    status: event.target.value as ImportMediaStatus,
                  })
                }
                className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.04] px-2 py-2 text-sm"
              >
                <option value="">—</option>
                <option value="WANT">Want</option>
                <option value="ONGOING">Ongoing</option>
                <option value="FINISHED">Finished</option>
              </select>
            </label>
          </div>
          <DuplicateControls row={row} onDuplicate={onDuplicate} />
          <button
            type="button"
            onClick={() => onUpdate(row.rowNumber, { ignored: !row.ignored })}
            className="text-sm text-white/45"
          >
            {row.ignored ? "Include this row" : "Ignore this row"}
          </button>
        </div>
      )}
    </div>
  );
}
