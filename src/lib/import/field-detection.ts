import type { ImportFieldMapping } from "@/lib/import/import-types";

type FieldKey = keyof ImportFieldMapping;

const FIELD_ALIASES: Record<FieldKey, string[]> = {
  title: [
    "title",
    "name",
    "作品名",
    "名称",
    "书名",
    "电影名",
    "专辑名",
  ],
  type: ["type", "category", "media_type", "media type", "类型", "分类"],
  creator: [
    "creator",
    "author",
    "director",
    "artist",
    "作者",
    "导演",
    "歌手",
    "艺术家",
  ],
  status: [
    "status",
    "state",
    "阅读状态",
    "观看状态",
    "收听状态",
  ],
  rating: ["rating", "score", "stars", "评分", "星级"],
  ratingScale: ["ratingscale", "rating_scale", "scale", "maxrating"],
  progress: ["progress", "percent", "percentage", "进度"],
  startDate: ["startdate", "start_date", "started", "开始日期", "开始时间"],
  endDate: ["enddate", "end_date", "finished", "完成日期", "结束日期"],
  shortReview: ["shortreview", "short_review", "review", "短评"],
  notes: ["notes", "note", "memo", "笔记", "备注"],
  cover: ["cover", "coverurl", "cover_url", "image", "poster"],
  externalId: ["externalid", "external_id", "id", "uuid", "isbn"],
};

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase().replace(/[\s_-]+/g, "");
}

export function detectFieldMapping(headers: string[]): ImportFieldMapping {
  const normalizedHeaders = headers.map((header) => ({
    original: header,
    normalized: normalizeHeader(header),
  }));

  const mapping: ImportFieldMapping = {};

  for (const field of Object.keys(FIELD_ALIASES) as FieldKey[]) {
    const aliases = FIELD_ALIASES[field].map(normalizeHeader);
    const match = normalizedHeaders.find((header) =>
      aliases.includes(header.normalized),
    );
    if (match) {
      mapping[field] = match.original;
    }
  }

  return mapping;
}

export function rowsFromCsvRecords(
  records: Record<string, string>[],
): Array<{ rowNumber: number; values: Record<string, string> }> {
  return records.map((values, index) => ({
    rowNumber: index + 2,
    values,
  }));
}
