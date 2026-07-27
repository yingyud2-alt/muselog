import type { LibraryItem } from "@/lib/library/library-types";

export type FeaturedCollectionId =
  | "quiet-nights"
  | "human-stories"
  | "slow-cinema";

export type FeaturedCollection = {
  id: FeaturedCollectionId;
  title: string;
  items: LibraryItem[];
};

const FEATURED: Array<{
  id: FeaturedCollectionId;
  title: string;
  keywords: string[];
  /** Prefer this media type when scoring ties / soft boost. */
  preferType?: LibraryItem["type"];
}> = [
  {
    id: "quiet-nights",
    title: "Quiet Nights",
    keywords: [
      "quiet",
      "night",
      "calm",
      "soft",
      "ambient",
      "gentle",
      "still",
      "rainy",
      "melancholy",
    ],
  },
  {
    id: "human-stories",
    title: "Human Stories",
    keywords: [
      "human",
      "literary",
      "reflective",
      "nostalgic",
      "tender",
      "story",
      "relationship",
      "memory",
      "bittersweet",
    ],
  },
  {
    id: "slow-cinema",
    title: "Slow Cinema",
    keywords: ["slow cinema", "slow", "visual", "cinema", "contemplative", "film"],
    preferType: "MOVIE",
  },
];

const TYPE_HINTS: Record<LibraryItem["type"], string> = {
  BOOK: "literary reflective quiet",
  MOVIE: "visual slow cinema human",
  MUSIC: "night soft ambient quiet",
};

function itemBlob(item: LibraryItem): string {
  return `${TYPE_HINTS[item.type]} ${item.notes ?? ""} ${item.shortReview ?? ""} ${item.title}`.toLowerCase();
}

function scoreItem(
  item: LibraryItem,
  keywords: string[],
  preferType?: LibraryItem["type"],
): number {
  const blob = itemBlob(item);
  let score = 0;
  for (const keyword of keywords) {
    if (blob.includes(keyword)) score += keyword.includes(" ") ? 3 : 2;
  }
  if (preferType && item.type === preferType) score += 1;
  if (item.status === "FINISHED") score += 1;
  return score;
}

/**
 * Three featured archive collections — thematic, not media-type shelves.
 * Built from existing library items (no separate collection store).
 */
export function buildFeaturedCollections(
  items: LibraryItem[],
): FeaturedCollection[] {
  const pool = items.filter((item) => item.status !== "DROPPED");

  return FEATURED.map((definition) => {
    const ranked = pool
      .map((item) => ({
        item,
        score: scoreItem(item, definition.keywords, definition.preferType),
      }))
      .filter((row) => row.score > 0)
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return b.item.updatedAt.localeCompare(a.item.updatedAt);
      })
      .map((row) => row.item);

    // Soft fill: prefer-type finished works when keyword matches are sparse.
    if (ranked.length < 3 && definition.preferType) {
      const seen = new Set(ranked.map((item) => item.mediaKey));
      const fillers = pool.filter(
        (item) =>
          item.type === definition.preferType &&
          item.status === "FINISHED" &&
          !seen.has(item.mediaKey),
      );
      ranked.push(...fillers);
    }

    return {
      id: definition.id,
      title: definition.title,
      items: ranked,
    };
  });
}
