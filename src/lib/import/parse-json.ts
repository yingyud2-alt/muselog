import type { RawImportRow } from "@/lib/import/import-types";

export type JsonParseResult =
  | { ok: true; rows: RawImportRow[] }
  | { ok: false; message: string };

export function parseImportJson(text: string): JsonParseResult {
  const trimmed = text.trim();
  if (!trimmed) {
    return { ok: false, message: "JSON is empty." };
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(trimmed);
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Invalid JSON";
    return { ok: false, message: `Invalid JSON: ${detail}` };
  }

  if (!Array.isArray(parsed)) {
    return { ok: false, message: "JSON root must be an array of records." };
  }

  if (parsed.length === 0) {
    return { ok: false, message: "JSON array is empty." };
  }

  const rows: RawImportRow[] = [];

  for (let index = 0; index < parsed.length; index += 1) {
    const entry = parsed[index];
    const rowNumber = index + 1;

    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      return {
        ok: false,
        message: `Invalid record at index ${index}. Each item must be an object.`,
      };
    }

    const values: Record<string, string> = {};
    for (const [key, value] of Object.entries(entry as Record<string, unknown>)) {
      if (value === null || value === undefined) {
        values[key] = "";
      } else if (typeof value === "object") {
        return {
          ok: false,
          message: `Nested value at row ${rowNumber}, field "${key}".`,
        };
      } else {
        values[key] = String(value);
      }
    }

    rows.push({ rowNumber, values });
  }

  return { ok: true, rows };
}
