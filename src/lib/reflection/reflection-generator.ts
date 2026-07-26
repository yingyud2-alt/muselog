import type { LibraryItem } from "@/lib/library/library-types";
import type {
  ReflectionInput,
  ReflectionResult,
} from "@/lib/reflection/reflection-types";

function hasTasteKeyword(
  tags: ReflectionInput["tasteTags"],
  ...needles: string[]
): boolean {
  const labels = tags.map((tag) => tag.label.toLowerCase());
  return needles.some((needle) =>
    labels.some((label) => label.includes(needle.toLowerCase())),
  );
}

function hasMoodKeyword(
  tags: ReflectionInput["moodTags"],
  ...needles: string[]
): boolean {
  const labels = tags.map((tag) => tag.label.toLowerCase());
  return needles.some((needle) => labels.includes(needle.toLowerCase()));
}

function highRatedWorks(works: ReflectionInput["completedWorks"]): LibraryItem[] {
  return works.filter((item) => (item.rating ?? 0) >= 4);
}

export function generateReflectionInsight(input: ReflectionInput): ReflectionResult {
  const { mediaStats, completedWorks, ongoingWorks, tasteTags, moodTags } = input;
  const insights: string[] = [];
  const patterns: string[] = [];
  const exploration: string[] = [];

  const { books, movies, music } = mediaStats;
  const totalMedia = books + movies + music;

  if (books > movies && books > music && books > 0) {
    insights.push("You spent more time with written stories this month.");
    patterns.push("Reading led your cultural rhythm.");
  } else if (movies > books && movies > music && movies > 0) {
    insights.push("Film carried much of your attention this month.");
    patterns.push("Visual storytelling shaped your month.");
  } else if (music > books && music > movies && music > 0) {
    insights.push("Music threaded through many of your days.");
    patterns.push("Listening became a recurring thread.");
  }

  if (hasTasteKeyword(tasteTags, "memory", "nostalgic")) {
    insights.push("You seem drawn to stories about memory and emotions.");
    patterns.push("Emotional memory keeps returning in your choices.");
  }

  if (hasTasteKeyword(tasteTags, "quiet", "slow")) {
    insights.push("Quiet, unhurried works kept finding their way to you.");
    patterns.push("You gravitated toward slower, softer narratives.");
  }

  if (ongoingWorks.length > 1) {
    insights.push("You are currently exploring multiple creative worlds.");
    patterns.push("Several journeys are unfolding at once.");
  }

  const rated = highRatedWorks(completedWorks);
  if (rated.length >= 2) {
    insights.push("You tend to keep works that leave a lasting emotional impression.");
    patterns.push("High ratings cluster around deeply felt experiences.");
  }

  if (mediaStats.journalDays >= 10) {
    insights.push("Your journal stayed active — a steady rhythm of reflection.");
    patterns.push("Regular journaling anchored your month.");
  }

  if (hasMoodKeyword(moodTags, "reflective")) {
    insights.push("A reflective mood ran through much of what you recorded.");
  }

  if (hasMoodKeyword(moodTags, "calm")) {
    insights.push("Calm, contemplative moments shaped your cultural pace.");
  }

  const uniqueInsights = [...new Set(insights)].slice(0, 3);
  const uniquePatterns = [...new Set(patterns)].slice(0, 3);

  if (uniqueInsights.length === 0 && totalMedia === 0) {
    return {
      summary: "Your reflection will grow as you explore and journal more.",
      insights: ["Keep exploring — your cultural story is still unfolding."],
      patterns: [],
      exploration: [
        "More quiet stories",
        "More human-centered films",
        "More reflective music",
      ],
    };
  }

  if (uniqueInsights.length === 0) {
    uniqueInsights.push("You moved through a varied mix of books, films, and music.");
  }

  if (hasTasteKeyword(tasteTags, "quiet", "slow")) {
    exploration.push("More quiet stories");
  }
  if (hasTasteKeyword(tasteTags, "human", "relationship")) {
    exploration.push("More human-centered films");
  }
  if (
    hasMoodKeyword(moodTags, "reflective", "calm") ||
    hasTasteKeyword(tasteTags, "memory")
  ) {
    exploration.push("More reflective music");
  }

  if (exploration.length === 0) {
    if (books <= movies) exploration.push("More quiet stories");
    if (movies <= music) exploration.push("More human-centered films");
    exploration.push("More reflective music");
  }

  const summary =
    uniqueInsights[0] ??
    `You explored ${totalMedia} works across books, films, and music this month.`;

  return {
    summary,
    insights: uniqueInsights,
    patterns: uniquePatterns,
    exploration: [...new Set(exploration)].slice(0, 3),
  };
}

export function buildReflectionPreview(
  month: string,
  monthYear: string,
  reflection: ReflectionResult,
): { summary: string; month: string; monthYear: string } {
  return {
    month,
    monthYear,
    summary: reflection.summary,
  };
}
