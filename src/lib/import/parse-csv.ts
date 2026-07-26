/** Lightweight CSV parser supporting quoted fields, commas, and newlines. */

export type CsvParseResult =
  | { ok: true; headers: string[]; rows: Record<string, string>[] }
  | { ok: false; message: string; row?: number };

function pushField(row: string[], field: string) {
  row.push(field);
}

export function parseCsv(text: string): CsvParseResult {
  const trimmed = text.replace(/^\uFEFF/, "").trim();
  if (!trimmed) {
    return { ok: false, message: "File is empty." };
  }

  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < trimmed.length; i += 1) {
    const char = trimmed[i];
    const next = trimmed[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (next === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      continue;
    }

    if (char === ",") {
      pushField(row, field);
      field = "";
      continue;
    }

    if (char === "\n" || (char === "\r" && next === "\n")) {
      pushField(row, field);
      field = "";
      if (row.some((cell) => cell.trim().length > 0)) {
        rows.push(row);
      }
      row = [];
      if (char === "\r") i += 1;
      continue;
    }

    if (char === "\r") {
      pushField(row, field);
      field = "";
      if (row.some((cell) => cell.trim().length > 0)) rows.push(row);
      row = [];
      continue;
    }

    field += char;
  }

  pushField(row, field);
  if (row.some((cell) => cell.trim().length > 0)) {
    rows.push(row);
  }

  if (inQuotes) {
    return { ok: false, message: "Unclosed quote in CSV." };
  }

  if (rows.length === 0) {
    return { ok: false, message: "No rows found in CSV." };
  }

  const headers = rows[0].map((header) => header.trim());
  if (headers.every((header) => !header)) {
    return { ok: false, message: "CSV header row is empty." };
  }

  const records: Record<string, string>[] = [];

  for (let rowIndex = 1; rowIndex < rows.length; rowIndex += 1) {
    const cells = rows[rowIndex];
    if (cells.every((cell) => !cell.trim())) continue;

    const record: Record<string, string> = {};
    for (let col = 0; col < headers.length; col += 1) {
      const key = headers[col] || `column_${col + 1}`;
      record[key] = (cells[col] ?? "").trim();
    }
    records.push(record);
  }

  if (records.length === 0) {
    return { ok: false, message: "CSV contains headers only." };
  }

  return { ok: true, headers, rows: records };
}

/** Manual test cases — run in dev console if needed. */
export const CSV_PARSER_FIXTURES = {
  quotedComma: 'title,type\n"Hello, World",BOOK',
  multiline: 'title,notes\nTest,"line1\nline2"',
  chineseHeaders: "作品名,类型\nNorwegian Wood,BOOK",
};
