/**
 * Explore discovery feed — mock data shaped for a future API.
 * Do not wire external providers here yet.
 */

export type DiscoveryCategory = "book" | "film" | "music";

export type DiscoveryModule =
  | "trending"
  | "new_release"
  | "community";

export type CommunityVoice = "reader" | "creator" | "critic";

/** API-ready discovery item */
export type ExploreDiscoveryItem = {
  id: string;
  title: string;
  creator: string;
  cover: string;
  category: DiscoveryCategory;
  /** Origin channel — editorial mock until providers land */
  source: "editorial" | "community" | "catalog";
  /** Short insight / recommendation reason */
  reason: string;
  module: DiscoveryModule;
  voice?: CommunityVoice;
  /** Optional link into existing CONTENT_CATALOG */
  contentId?: string;
};

export type DiscoveryCategoryTab = {
  id: DiscoveryCategory;
  label: string;
};

export const DISCOVERY_CATEGORY_TABS: DiscoveryCategoryTab[] = [
  { id: "book", label: "Books" },
  { id: "film", label: "Films" },
  { id: "music", label: "Music" },
];

type ModuleCopy = {
  title: string;
  description: string;
};

export const DISCOVERY_MODULE_COPY: Record<
  DiscoveryCategory,
  Record<DiscoveryModule, ModuleCopy>
> = {
  book: {
    trending: {
      title: "Trending Books",
      description: "Titles quietly gathering attention among reflective readers",
    },
    new_release: {
      title: "New Releases",
      description: "Recent works worth lingering with",
    },
    community: {
      title: "Community Voices",
      description: "Notes from readers, creators, and critics",
    },
  },
  film: {
    trending: {
      title: "Trending Films",
      description: "Cinema circulating through slow evenings and soft light",
    },
    new_release: {
      title: "New Releases",
      description: "Fresh frames entering the cultural conversation",
    },
    community: {
      title: "Community Picks",
      description: "Films recommended by watchers, makers, and critics",
    },
  },
  music: {
    trending: {
      title: "Trending Albums",
      description: "Records that keep returning on late-night listens",
    },
    new_release: {
      title: "New Releases",
      description: "Albums arriving with a softer kind of urgency",
    },
    community: {
      title: "Community Discoveries",
      description: "Albums shared by listeners, artists, and writers",
    },
  },
};

export const EXPLORE_DISCOVERY_ITEMS: ExploreDiscoveryItem[] = [
  // —— Books · Trending ——
  {
    id: "disc-book-trend-norwegian-wood",
    title: "Norwegian Wood",
    creator: "Haruki Murakami",
    cover: "from-emerald-900 via-teal-900 to-slate-950",
    category: "book",
    source: "catalog",
    reason: "A rain-soaked memory novel readers keep returning to.",
    module: "trending",
    contentId: "book-norwegian-wood",
  },
  {
    id: "disc-book-trend-never-let-me-go",
    title: "Never Let Me Go",
    creator: "Kazuo Ishiguro",
    cover: "from-stone-700 via-slate-900 to-neutral-950",
    category: "book",
    source: "editorial",
    reason: "Quiet dread wrapped in pastoral English light.",
    module: "trending",
  },
  {
    id: "disc-book-trend-dept-of-speculation",
    title: "Dept. of Speculation",
    creator: "Jenny Offill",
    cover: "from-amber-900 via-stone-900 to-slate-950",
    category: "book",
    source: "editorial",
    reason: "Fragmented notes on marriage, art, and almost-leaving.",
    module: "trending",
  },
  {
    id: "disc-book-trend-little-prince",
    title: "The Little Prince",
    creator: "Antoine de Saint-Exupéry",
    cover: "from-amber-800 via-orange-950 to-slate-950",
    category: "book",
    source: "catalog",
    reason: "Still the gentlest map back to what matters.",
    module: "trending",
    contentId: "book-the-little-prince",
  },

  // —— Books · New ——
  {
    id: "disc-book-new-intermezzo",
    title: "Intermezzo",
    creator: "Sally Rooney",
    cover: "from-rose-950 via-stone-900 to-neutral-950",
    category: "book",
    source: "editorial",
    reason: "Two brothers, grief, and the awkward music of intimacy.",
    module: "new_release",
  },
  {
    id: "disc-book-new-creation-lake",
    title: "Creation Lake",
    creator: "Rachel Kushner",
    cover: "from-lime-950 via-emerald-950 to-slate-950",
    category: "book",
    source: "editorial",
    reason: "A spy novel that listens more than it chases.",
    module: "new_release",
  },
  {
    id: "disc-book-new-martyr",
    title: "Martyr!",
    creator: "Kaveh Akbar",
    cover: "from-violet-950 via-indigo-950 to-slate-950",
    category: "book",
    source: "editorial",
    reason: "Orphanhood, addiction, and the hunger for meaning.",
    module: "new_release",
  },
  {
    id: "disc-book-new-kafka",
    title: "Kafka on the Shore",
    creator: "Haruki Murakami",
    cover: "from-indigo-900 via-violet-900 to-slate-950",
    category: "book",
    source: "catalog",
    reason: "Dream logic for readers who like doors left ajar.",
    module: "new_release",
    contentId: "book-kafka-on-the-shore",
  },

  // —— Books · Community ——
  {
    id: "disc-book-comm-reader",
    title: "A Ghost in the Throat",
    creator: "Doireann Ní Ghríofa",
    cover: "from-teal-950 via-cyan-950 to-slate-950",
    category: "book",
    source: "community",
    reason: "A reader called it ‘translation as devotion’.",
    module: "community",
    voice: "reader",
  },
  {
    id: "disc-book-comm-creator",
    title: "The Years",
    creator: "Annie Ernaux",
    cover: "from-neutral-800 via-stone-900 to-black",
    category: "book",
    source: "community",
    reason: "A novelist recommended it as a personal archive in prose.",
    module: "community",
    voice: "creator",
  },
  {
    id: "disc-book-comm-critic",
    title: "Orbital",
    creator: "Samantha Harvey",
    cover: "from-sky-950 via-indigo-950 to-slate-950",
    category: "book",
    source: "community",
    reason: "Critics praise its orbit of Earth as a meditation on care.",
    module: "community",
    voice: "critic",
  },
  {
    id: "disc-book-comm-reader-2",
    title: "Norwegian Wood",
    creator: "Haruki Murakami",
    cover: "from-emerald-900 via-teal-900 to-slate-950",
    category: "book",
    source: "community",
    reason: "Passed between friends as ‘the book for rainy Octobers’.",
    module: "community",
    voice: "reader",
    contentId: "book-norwegian-wood",
  },

  // —— Films · Trending ——
  {
    id: "disc-film-trend-perfect-days",
    title: "Perfect Days",
    creator: "Wim Wenders",
    cover: "from-stone-700 via-stone-900 to-neutral-950",
    category: "film",
    source: "catalog",
    reason: "Routine as refuge — still circulating among quiet watchers.",
    module: "trending",
    contentId: "movie-perfect-days",
  },
  {
    id: "disc-film-trend-mood-for-love",
    title: "In the Mood for Love",
    creator: "Wong Kar-wai",
    cover: "from-fuchsia-900 via-purple-950 to-slate-950",
    category: "film",
    source: "catalog",
    reason: "Longing held at a careful distance.",
    module: "trending",
    contentId: "movie-in-the-mood-for-love",
  },
  {
    id: "disc-film-trend-past-lives",
    title: "Past Lives",
    creator: "Celine Song",
    cover: "from-blue-950 via-slate-900 to-neutral-950",
    category: "film",
    source: "editorial",
    reason: "What-ifs across cities, languages, and decades.",
    module: "trending",
  },
  {
    id: "disc-film-trend-anatomy",
    title: "Anatomy of a Fall",
    creator: "Justine Triet",
    cover: "from-zinc-800 via-stone-950 to-black",
    category: "film",
    source: "editorial",
    reason: "A courtroom drama that listens for the gaps in truth.",
    module: "trending",
  },

  // —— Films · New ——
  {
    id: "disc-film-new-brutalist",
    title: "The Brutalist",
    creator: "Brady Corbet",
    cover: "from-stone-800 via-amber-950 to-neutral-950",
    category: "film",
    source: "editorial",
    reason: "Ambition cast in concrete and immigrant light.",
    module: "new_release",
  },
  {
    id: "disc-film-new-challengers",
    title: "Challengers",
    creator: "Luca Guadagnino",
    cover: "from-orange-950 via-rose-950 to-slate-950",
    category: "film",
    source: "editorial",
    reason: "Desire as sport — sweat, scoreboards, and sideways glances.",
    module: "new_release",
  },
  {
    id: "disc-film-new-zone",
    title: "The Zone of Interest",
    creator: "Jonathan Glazer",
    cover: "from-green-950 via-stone-900 to-black",
    category: "film",
    source: "editorial",
    reason: "Horror in the next garden over — still hard to look away.",
    module: "new_release",
  },
  {
    id: "disc-film-new-before-sunrise",
    title: "Before Sunrise",
    creator: "Richard Linklater",
    cover: "from-rose-900 via-red-950 to-neutral-950",
    category: "film",
    source: "catalog",
    reason: "One night of talk that still feels newly released each revisit.",
    module: "new_release",
    contentId: "movie-before-sunrise",
  },

  // —— Films · Community ——
  {
    id: "disc-film-comm-reader",
    title: "Aftersun",
    creator: "Charlotte Wells",
    cover: "from-sky-900 via-cyan-950 to-slate-950",
    category: "film",
    source: "community",
    reason: "A viewer described it as ‘memory developing in the darkroom’.",
    module: "community",
    voice: "reader",
  },
  {
    id: "disc-film-comm-creator",
    title: "Drive My Car",
    creator: "Ryusuke Hamaguchi",
    cover: "from-red-950 via-neutral-900 to-slate-950",
    category: "film",
    source: "community",
    reason: "A filmmaker called its silences more eloquent than dialogue.",
    module: "community",
    voice: "creator",
  },
  {
    id: "disc-film-comm-critic",
    title: "Portrait of a Lady on Fire",
    creator: "Céline Sciamma",
    cover: "from-amber-950 via-orange-950 to-stone-950",
    category: "film",
    source: "community",
    reason: "Critics return to it as a study of looking and being seen.",
    module: "community",
    voice: "critic",
  },
  {
    id: "disc-film-comm-critic-2",
    title: "Perfect Days",
    creator: "Wim Wenders",
    cover: "from-stone-700 via-stone-900 to-neutral-950",
    category: "film",
    source: "community",
    reason: "Recommended as cinema that lowers your heart rate.",
    module: "community",
    voice: "critic",
    contentId: "movie-perfect-days",
  },

  // —— Music · Trending ——
  {
    id: "disc-music-trend-blonde",
    title: "Blonde",
    creator: "Frank Ocean",
    cover: "from-sky-900 via-blue-950 to-slate-950",
    category: "music",
    source: "catalog",
    reason: "Still the late-night album for soft identities.",
    module: "trending",
    contentId: "music-blonde",
  },
  {
    id: "disc-music-trend-carrie",
    title: "Carrie & Lowell",
    creator: "Sufjan Stevens",
    cover: "from-cyan-900 via-teal-950 to-slate-950",
    category: "music",
    source: "catalog",
    reason: "Grief in hush tones — circulating again each winter.",
    module: "trending",
    contentId: "music-carrie-and-lowell",
  },
  {
    id: "disc-music-trend-punisher",
    title: "Punisher",
    creator: "Phoebe Bridgers",
    cover: "from-violet-950 via-indigo-950 to-slate-950",
    category: "music",
    source: "editorial",
    reason: "Melancholy with a dry, knowing smile.",
    module: "trending",
  },
  {
    id: "disc-music-trend-for-emma",
    title: "For Emma, Forever Ago",
    creator: "Bon Iver",
    cover: "from-slate-700 via-slate-900 to-black",
    category: "music",
    source: "catalog",
    reason: "Cabin dusk, still trending among solitary walks.",
    module: "trending",
    contentId: "music-for-emma-forever-ago",
  },

  // —— Music · New ——
  {
    id: "disc-music-new-brat",
    title: "Brat",
    creator: "Charli XCX",
    cover: "from-lime-800 via-green-950 to-slate-950",
    category: "music",
    source: "editorial",
    reason: "Club neon with a surprisingly tender aftertaste.",
    module: "new_release",
  },
  {
    id: "disc-music-new-hit-me",
    title: "Hit Me Hard and Soft",
    creator: "Billie Eilish",
    cover: "from-blue-950 via-indigo-950 to-black",
    category: "music",
    source: "editorial",
    reason: "Intimate production that still fills a room.",
    module: "new_release",
  },
  {
    id: "disc-music-new-short-n-sweet",
    title: "Short n' Sweet",
    creator: "Sabrina Carpenter",
    cover: "from-pink-950 via-rose-950 to-stone-950",
    category: "music",
    source: "editorial",
    reason: "Sharp wit over sunlit pop arrangements.",
    module: "new_release",
  },
  {
    id: "disc-music-new-madvillainy",
    title: "Madvillainy",
    creator: "Madvillain",
    cover: "from-yellow-900 via-stone-900 to-neutral-950",
    category: "music",
    source: "editorial",
    reason: "Dusty loops rediscovered by a new generation of crates.",
    module: "new_release",
  },

  // —— Music · Community ——
  {
    id: "disc-music-comm-reader",
    title: "Blue",
    creator: "Joni Mitchell",
    cover: "from-blue-900 via-slate-900 to-neutral-950",
    category: "music",
    source: "community",
    reason: "A listener called it ‘the diary you sing instead of write’.",
    module: "community",
    voice: "reader",
  },
  {
    id: "disc-music-comm-creator",
    title: "Blonde",
    creator: "Frank Ocean",
    cover: "from-sky-900 via-blue-950 to-slate-950",
    category: "music",
    source: "community",
    reason: "An artist named it the record that taught them patience.",
    module: "community",
    voice: "creator",
    contentId: "music-blonde",
  },
  {
    id: "disc-music-comm-critic",
    title: "Fetch the Bolt Cutters",
    creator: "Fiona Apple",
    cover: "from-amber-950 via-stone-900 to-black",
    category: "music",
    source: "community",
    reason: "Critics still cite its kitchen percussion as liberation.",
    module: "community",
    voice: "critic",
  },
  {
    id: "disc-music-comm-reader-2",
    title: "Carrie & Lowell",
    creator: "Sufjan Stevens",
    cover: "from-cyan-900 via-teal-950 to-slate-950",
    category: "music",
    source: "community",
    reason: "Shared as a companion for grief that needs soft company.",
    module: "community",
    voice: "reader",
    contentId: "music-carrie-and-lowell",
  },
];

const MODULE_ORDER: DiscoveryModule[] = [
  "trending",
  "new_release",
  "community",
];

export function getDiscoveryItems(
  category: DiscoveryCategory,
  module: DiscoveryModule,
): ExploreDiscoveryItem[] {
  return EXPLORE_DISCOVERY_ITEMS.filter(
    (item) => item.category === category && item.module === module,
  );
}

export function getDiscoverySections(category: DiscoveryCategory) {
  return MODULE_ORDER.map((module) => ({
    module,
    ...DISCOVERY_MODULE_COPY[category][module],
    items: getDiscoveryItems(category, module),
  }));
}
