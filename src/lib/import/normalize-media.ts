import type {
  ImportMediaStatus,
  ImportMediaType,
  RatingScaleMode,
} from "@/lib/import/import-types";

export function normalizeTitle(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[，。！？、；：""''（）【】]/g, "")
    .replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "");
}

const TYPE_PATTERNS: Array<{ type: ImportMediaType; tokens: string[] }> = [
  {
    type: "BOOK",
    tokens: [
      "book",
      "books",
      "reading",
      "novel",
      "书",
      "书籍",
      "图书",
      "阅读",
    ],
  },
  {
    type: "MOVIE",
    tokens: [
      "movie",
      "film",
      "cinema",
      "watch",
      "电影",
      "影片",
      "影视",
      "观影",
    ],
  },
  {
    type: "MUSIC",
    tokens: [
      "music",
      "album",
      "song",
      "listen",
      "音乐",
      "专辑",
      "歌曲",
      "收听",
    ],
  },
];

const STATUS_PATTERNS: Array<{ status: ImportMediaStatus; tokens: string[] }> =
  [
    {
      status: "WANT",
      tokens: [
        "want",
        "planned",
        "wishlist",
        "to read",
        "to watch",
        "to listen",
        "想读",
        "想看",
        "想听",
        "计划",
        "待读",
        "待看",
        "待听",
      ],
    },
    {
      status: "ONGOING",
      tokens: [
        "ongoing",
        "in progress",
        "reading",
        "watching",
        "listening",
        "在读",
        "在看",
        "在听",
        "进行中",
      ],
    },
    {
      status: "FINISHED",
      tokens: [
        "finished",
        "completed",
        "read",
        "watched",
        "listened",
        "已读",
        "已看",
        "已听",
        "完成",
      ],
    },
  ];

export function normalizeImportType(
  raw?: string,
): ImportMediaType | undefined {
  if (!raw?.trim()) return undefined;
  const normalized = raw.trim().toLowerCase();

  for (const entry of TYPE_PATTERNS) {
    if (entry.tokens.some((token) => normalized.includes(token))) {
      return entry.type;
    }
  }

  if (normalized === "book") return "BOOK";
  if (normalized === "movie") return "MOVIE";
  if (normalized === "music") return "MUSIC";

  return undefined;
}

export function normalizeImportStatus(
  raw?: string,
): ImportMediaStatus | undefined {
  if (!raw?.trim()) return undefined;
  const normalized = raw.trim().toLowerCase();

  for (const entry of STATUS_PATTERNS) {
    if (entry.tokens.some((token) => normalized === token || normalized.includes(token))) {
      return entry.status;
    }
  }

  return undefined;
}

export function normalizeRating(
  raw: string | undefined,
  scaleMode: RatingScaleMode,
  rowScale?: number,
): { rating?: number; original?: number; scale?: number; error?: string } {
  if (!raw?.trim() || scaleMode === "none") {
    return {};
  }

  const value = Number.parseFloat(raw.trim());
  if (Number.isNaN(value)) {
    return { error: "Invalid rating" };
  }

  if (value < 0 || value > 10) {
    return { error: "Rating out of supported range" };
  }

  let normalized = value;
  let scale = rowScale;

  if (scaleMode === "10-point" || (scale === 10 && scaleMode !== "5-star")) {
    normalized = value / 2;
    scale = 10;
  } else if (scaleMode === "5-star") {
    scale = 5;
    if (value > 5) {
      return { error: "Rating exceeds 5-star scale" };
    }
  } else if (scaleMode === "normalized") {
    scale = rowScale ?? 5;
    if (scale === 10) normalized = value / 2;
    if (normalized > 5) {
      return { error: "Normalized rating exceeds 5" };
    }
  }

  normalized = Math.round(normalized * 10) / 10;
  normalized = Math.max(0, Math.min(5, normalized));

  return {
    rating: normalized,
    original: value,
    scale,
  };
}

export function normalizeProgress(raw?: string): {
  progress?: number;
  error?: string;
} {
  if (!raw?.trim()) return {};

  const trimmed = raw.trim();
  let value: number;

  if (trimmed.endsWith("%")) {
    value = Number.parseFloat(trimmed.slice(0, -1));
  } else {
    value = Number.parseFloat(trimmed);
    if (!Number.isNaN(value) && value > 0 && value <= 1) {
      value *= 100;
    }
  }

  if (Number.isNaN(value)) {
    return { error: "Invalid progress" };
  }

  if (value < 0 || value > 100) {
    return { error: "Progress must be between 0 and 100" };
  }

  return { progress: Math.round(value) };
}

export function isAmbiguousSlashDate(value: string): boolean {
  const match = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return false;
  const a = Number(match[1]);
  const b = Number(match[2]);
  return a <= 12 && b <= 12 && a !== b;
}

export function parseImportDate(
  raw: string | undefined,
  preference: "YYYY-MM-DD" | "MM/DD/YYYY" | "DD/MM/YYYY",
): { date?: string; error?: string; ambiguous?: boolean } {
  if (!raw?.trim()) return {};

  const value = raw.trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return validateIso(value);
  }

  if (/^\d{4}\/\d{2}\/\d{2}$/.test(value)) {
    const [y, m, d] = value.split("/");
    return validateIso(`${y}-${m}-${d}`);
  }

  const cnMatch = value.match(/^(\d{4})年(\d{1,2})月(\d{1,2})日?$/);
  if (cnMatch) {
    const month = cnMatch[2].padStart(2, "0");
    const day = cnMatch[3].padStart(2, "0");
    return validateIso(`${cnMatch[1]}-${month}-${day}`);
  }

  const slashMatch = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    if (isAmbiguousSlashDate(value)) {
      return { ambiguous: true, error: "Ambiguous date format" };
    }

    const first = Number(slashMatch[1]);
    const second = Number(slashMatch[2]);
    const year = slashMatch[3];

    let month = first;
    let day = second;

    if (preference === "DD/MM/YYYY") {
      day = first;
      month = second;
    }

    return validateIso(
      `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
    );
  }

  return { error: "Invalid date" };
}

function validateIso(value: string): { date?: string; error?: string } {
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));

  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return { error: "Invalid date" };
  }

  return { date: value };
}

export function stableImportHash(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash.toString(36);
}
