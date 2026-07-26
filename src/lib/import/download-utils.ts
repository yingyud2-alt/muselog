import type { ImportExecutionResult } from "@/lib/import/import-types";

export const CSV_TEMPLATE_HEADER =
  "title,type,creator,status,rating,ratingScale,progress,startDate,endDate,shortReview,notes,cover";

export const CSV_TEMPLATE_SAMPLE = `${CSV_TEMPLATE_HEADER}
Norwegian Wood,BOOK,Haruki Murakami,FINISHED,4.5,5,100,2026-07-01,2026-07-12,Quiet and unforgettable.,,`;

export const JSON_EXAMPLE = `[
  {
    "title": "Norwegian Wood",
    "type": "BOOK",
    "creator": "Haruki Murakami",
    "status": "FINISHED",
    "rating": 4.5,
    "ratingScale": 5,
    "startDate": "2026-07-01",
    "endDate": "2026-07-12",
    "shortReview": "Quiet and unforgettable.",
    "notes": "",
    "cover": ""
  }
]`;

export function downloadTextFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function downloadCsvTemplate() {
  downloadTextFile(
    "muselog-import-template.csv",
    CSV_TEMPLATE_SAMPLE,
    "text/csv;charset=utf-8",
  );
}

export function downloadErrorReport(result: ImportExecutionResult) {
  const header = "row,title,errorField,errorMessage,originalValue";
  const lines = result.errors.map((error) =>
    [
      error.row,
      `"${error.title.replace(/"/g, '""')}"`,
      error.errorField,
      `"${error.errorMessage.replace(/"/g, '""')}"`,
      `"${(error.originalValue ?? "").replace(/"/g, '""')}"`,
    ].join(","),
  );

  downloadTextFile(
    "muselog-import-errors.csv",
    [header, ...lines].join("\n"),
    "text/csv;charset=utf-8",
  );
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
