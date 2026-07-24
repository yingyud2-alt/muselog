export type MediaType = "BOOK" | "MOVIE" | "MUSIC" | "PODCAST" | "TV";

export type WorkBubble = {
  id: number;
  type: MediaType;
  title: string;
  creator: string;
  quote: string;
  color: string;
  baseSize: number;
  alwaysVisible: boolean;
};

/** Featured palette — distinct cool tones per hero bubble */
const FEATURED_COLOR_BY_ID: Record<number, string> = {
  1: "#6D8FA3",
  2: "#4D5963",
  3: "#6E8682",
  4: "#93ACAA",
  5: "#2F3D4D",
  7: "#455A4F",
  8: "#7AD9BD",
};

/** Blind-box distribution — 35% navy, 25% blue, 20% sage, 15% forest, 5% mint */
const BLIND_COLOR_WEIGHTS = [
  { color: "#2F3D4D", weight: 35 },
  { color: "#4D5963", weight: 9 },
  { color: "#6D8FA3", weight: 8 },
  { color: "#93ACAA", weight: 8 },
  { color: "#6E8682", weight: 20 },
  { color: "#455A4F", weight: 15 },
  { color: "#8FCBAB", weight: 5 },
] as const;

function pickBlindBoxColor(id: number): string {
  const seed = hashSeed(id * 61);
  const roll = seed % 100;
  let cumulative = 0;

  for (const entry of BLIND_COLOR_WEIGHTS) {
    cumulative += entry.weight;

    if (roll < cumulative) {
      return entry.color;
    }
  }

  return "#2F3D4D";
}

function pickFeaturedColor(workId: number): string {
  return FEATURED_COLOR_BY_ID[workId] ?? "#6D8FA3";
}

const EXTRA_TITLES = [
  "The Wind-Up Bird Chronicle",
  "Drive My Car",
  "Channel Orange",
  "Serial",
  "The Bear",
  "Moonlight",
  "Kind of Blue",
  "Educated",
  "Past Lives",
  "Random Access Memories",
  "Dark",
  "Normal People",
  "Arrival",
  "Illinois",
  "Radiolab",
  "Succession",
  "The God of Small Things",
  "Aftersun",
  "Currents",
  "This American Life",
  "The Leftovers",
  "Portrait of a Lady on Fire",
  "For Emma, Forever Ago",
  "Conversations with Friends",
  "Shoplifters",
  "The Overstory",
  "Minari",
  "Blonde on Blonde",
  "Reply All",
  "Fleabag",
  "1Q84",
  "Columbus",
  "In Rainbows",
  "Heavyweight",
  "Atlanta",
  "The Remains of the Day",
  "Call Me by Your Name",
  "Homogenic",
  "99% Invisible",
  "The Wire",
  "Never Let Me Go",
  "The Florida Project",
  "Vespertine",
  "Song Exploder",
  "Mad Men",
  "White Noise",
  "Paterson",
  "Kid A",
  "Decoder Ring",
  "Twin Peaks",
  "Station Eleven",
  "The Farewell",
  "Burning",
  "Melancholia",
  "The Double",
  "Her",
  "Ex Machina",
  "The Master",
  "Phantom Thread",
  "The Lighthouse",
  "First Reformed",
  "The Zone of Interest",
  "Anatomy of a Fall",
  "Amélie",
  "The Grand Budapest Hotel",
  "The Tree of Life",
  "A Ghost Story",
  "The Green Knight",
  "Everything Everywhere All at Once",
  "The Worst Person in the World",
  "Playtime",
  "Stalker",
  "Solaris",
  "Persona",
  "Tokyo Story",
  "Yi Yi",
  "Happy Together",
  "Chungking Express",
  "The Handmaiden",
  "The Quiet Girl",
  "The Banshees of Inisherin",
  "The Favourite",
  "The Lobster",
  "Holy Motors",
  "Beau Travail",
  "Close-Up",
  "A Separation",
  "Parasite",
  "Poetry",
  "Still Walking",
  "Shoplifters",
  "Our Little Sister",
  "Memoria",
  "Past Lives",
  "Aftersun",
  "Columbus",
  "Paterson",
  "Minari",
  "The Farewell",
  "Drive My Car",
  "Perfect Blue",
  "Paprika",
  "Millennium Actress",
  "Spirited Away",
  "Howl's Moving Castle",
  "The Tale of The Princess Kaguya",
  "Grave of the Fireflies",
  "Your Name",
  "Weathering With You",
  "Suzume",
  "The Boy and the Heron",
  "Blue Period",
  "Ping Pong",
  "Monster",
  "Shoplifters",
  "Nobody Knows",
  "Like Father, Like Son",
  "Wheel of Fortune and Fantasy",
  "Drive My Car",
  "The Taste of Tea",
  "Still Walking",
  "Our Little Sister",
  "Shoplifters",
  "Burning",
  "Decision to Leave",
  "The Handmaiden",
  "Oldboy",
  "Memories of Murder",
  "Mother",
  "The Host",
  "Okja",
  "Snowpiercer",
  "The Mist",
  "The Leftovers",
  "Severance",
  "The Bear",
  "Fleabag",
  "Atlanta",
  "Mad Men",
  "The Wire",
  "Succession",
  "Radiolab",
  "This American Life",
  "Song Exploder",
  "Decoder Ring",
  "Heavyweight",
  "Reply All",
  "99% Invisible",
] as const;

const EXTRA_CREATORS = [
  "Haruki Murakami",
  "Ryusuke Hamaguchi",
  "Frank Ocean",
  "Sarah Koenig",
  "Christopher Storer",
  "Barry Jenkins",
  "Miles Davis",
  "Tara Westover",
  "Celine Song",
  "Daft Punk",
  "Sally Rooney",
  "Denis Villeneuve",
  "Sufjan Stevens",
  "Jad Abumrad",
  "Jesse Armstrong",
  "Arundhati Roy",
  "Charlotte Wells",
  "Tame Impala",
  "Ira Glass",
  "Damon Lindelof",
  "Céline Sciamma",
  "Bon Iver",
  "Hirokazu Kore-eda",
  "Richard Powers",
  "Lee Isaac Chung",
  "Bob Dylan",
  "PJ Vogt",
  "Phoebe Waller-Bridge",
  "Kogonada",
  "Radiohead",
  "Jonathan Goldstein",
  "Donald Glover",
  "Kazuo Ishiguro",
  "Luca Guadagnino",
  "Björk",
  "Roman Mars",
  "David Simon",
  "Sean Baker",
  "Hrishikesh Hirway",
  "Matthew Weiner",
  "Don DeLillo",
  "Jim Jarmusch",
  "David Lynch",
  "Emily St. John Mandel",
  "Lulu Wang",
  "Chang-dong Lee",
  "Lars von Trier",
  "Spike Jonze",
  "Alex Garland",
  "Paul Thomas Anderson",
  "Jonathan Glazer",
  "Justine Triet",
  "Michel Gondry",
  "Wes Anderson",
  "Terrence Malick",
  "David Lowery",
  "Daniels",
  "Jacques Tati",
  "Andrei Tarkovsky",
  "Ingmar Bergman",
  "Yasujirō Ozu",
  "Edward Yang",
  "Wong Kar-wai",
  "Jean-Pierre Jeunet",
  "Park Chan-wook",
  "Martin McDonagh",
  "Yorgos Lanthimos",
  "Leos Carax",
  "Claire Denis",
  "Victor Erice",
  "Abbas Kiarostami",
  "Apichatpong Weerasethakul",
  "Bong Joon-ho",
  "Ken Loach",
  "Agnès Varda",
  "Sofia Coppola",
  "Greta Gerwig",
  "Noah Baumbach",
  "Kelly Reichardt",
  "Lucrecia Martel",
  "Tsai Ming-liang",
  "Hou Hsiao-hsien",
  "Nuri Bilge Ceylan",
  "Asghar Farhadi",
  "Carlos Reygadas",
  "Chloé Zhao",
  "Steve McQueen",
  "Wim Wenders",
  "Richard Linklater",
  "Christopher Nolan",
  "Sufjan Stevens",
  "Satoshi Kon",
  "Hayao Miyazaki",
  "Isao Takahata",
  "Makoto Shinkai",
  "Mamoru Hosoda",
  "Naoko Yamada",
  "Masaaki Yuasa",
  "Hirokazu Kore-eda",
  "Hirokazu Kore-eda",
  "Hirokazu Kore-eda",
  "Hirokazu Kore-eda",
  "Chang-dong Lee",
  "Park Chan-wook",
  "Bong Joon-ho",
  "Bong Joon-ho",
  "Bong Joon-ho",
  "Bong Joon-ho",
  "Damon Lindelof",
  "Ben Stiller",
  "Christopher Storer",
  "Donald Glover",
  "Matthew Weiner",
  "David Simon",
  "Jesse Armstrong",
  "Jad Abumrad",
  "Ira Glass",
  "Hrishikesh Hirway",
  "Mitch Horowitz",
  "PJ Vogt",
  "Roman Mars",
] as const;

const EXTRA_QUOTES = [
  "Let the quiet lead you.",
  "Stay with the feeling.",
  "Notice what lingers.",
  "Follow the thread.",
  "Make room to wonder.",
  "Trust the pause.",
  "Look a little closer.",
  "Keep something soft open.",
  "Return to what moved you.",
  "Hold the moment gently.",
  "Drift, then arrive.",
  "Let time stretch.",
  "Find warmth in detail.",
  "Listen between the lines.",
  "Leave space for surprise.",
  "Stay present, stay curious.",
  "Carry the mood forward.",
  "Let memory breathe.",
  "Choose wonder over hurry.",
  "Follow the faint light.",
  "Wait for the right note.",
  "Find stillness inside motion.",
  "Keep your attention soft.",
  "Let the mood arrive slowly.",
] as const;

const MEDIA_TYPES: MediaType[] = [
  "BOOK",
  "MOVIE",
  "MUSIC",
  "PODCAST",
  "TV",
];

const ALWAYS_VISIBLE_SIZE_BY_ID: Record<number, number> = {
  1: 168,
  2: 198,
  3: 192,
  4: 154,
  5: 172,
  7: 176,
  8: 150,
};

type PrimaryWorkSeed = Omit<WorkBubble, "color" | "baseSize" | "alwaysVisible"> & {
  alwaysVisible: boolean;
};

const PRIMARY_WORKS: PrimaryWorkSeed[] = [
  {
    id: 1,
    type: "BOOK",
    title: "Norwegian Wood",
    creator: "Haruki Murakami",
    quote: "Some stories whisper softly.",
    alwaysVisible: true,
  },
  {
    id: 2,
    type: "MOVIE",
    title: "Perfect Days",
    creator: "Wim Wenders",
    quote: "Create before you consume.",
    alwaysVisible: true,
  },
  {
    id: 3,
    type: "MUSIC",
    title: "Blonde",
    creator: "Frank Ocean",
    quote: "Find beauty in silence.",
    alwaysVisible: true,
  },
  {
    id: 4,
    type: "BOOK",
    title: "Kafka on the Shore",
    creator: "Haruki Murakami",
    quote: "A warm place to return.",
    alwaysVisible: true,
  },
  {
    id: 5,
    type: "MOVIE",
    title: "Before Sunrise",
    creator: "Richard Linklater",
    quote: "Slow down and breathe.",
    alwaysVisible: true,
  },
  {
    id: 6,
    type: "MOVIE",
    title: "Interstellar",
    creator: "Christopher Nolan",
    quote: "Leave reality for a while.",
    alwaysVisible: false,
  },
  {
    id: 7,
    type: "MOVIE",
    title: "In the Mood for Love",
    creator: "Wong Kar-wai",
    quote: "Some moments never fade.",
    alwaysVisible: true,
  },
  {
    id: 8,
    type: "MUSIC",
    title: "Carrie & Lowell",
    creator: "Sufjan Stevens",
    quote: "Let imagination guide you.",
    alwaysVisible: true,
  },
];

function hashSeed(value: number): number {
  let seed = value * 2654435761;

  seed ^= seed << 13;
  seed ^= seed >> 17;
  seed ^= seed << 5;

  return Math.abs(seed);
}

function blindBoxSizeFromSeed(seed: number): number {
  const tier = seed % 100;

  if (tier < 40) {
    return 14 + (seed % 11);
  }

  if (tier < 65) {
    return 26 + (seed % 17);
  }

  if (tier < 88) {
    return 44 + (seed % 29);
  }

  return 76 + (seed % 23);
}

function buildPrimaryWork(work: PrimaryWorkSeed): WorkBubble {
  const seed = hashSeed(work.id);
  let baseSize: number;

  if (work.alwaysVisible) {
    baseSize = ALWAYS_VISIBLE_SIZE_BY_ID[work.id] ?? 132;
  } else if (work.id === 6) {
    baseSize = 78;
  } else {
    baseSize = blindBoxSizeFromSeed(seed);
  }

  return {
    ...work,
    color: work.alwaysVisible
      ? pickFeaturedColor(work.id)
      : pickBlindBoxColor(work.id),
    baseSize,
    alwaysVisible: work.alwaysVisible,
  };
}

function buildExtraWork(id: number): WorkBubble {
  const seed = hashSeed(id);
  const title = EXTRA_TITLES[(id - 9) % EXTRA_TITLES.length];
  const creator = EXTRA_CREATORS[(id - 9) % EXTRA_CREATORS.length];
  const quote = EXTRA_QUOTES[seed % EXTRA_QUOTES.length];
  const type = MEDIA_TYPES[seed % MEDIA_TYPES.length];

  return {
    id,
    type,
    title,
    creator,
    quote,
    color: pickBlindBoxColor(id),
    baseSize: blindBoxSizeFromSeed(seed),
    alwaysVisible: false,
  };
}

const EXTRA_WORK_COUNT = 92;

export const WORK_BUBBLES: WorkBubble[] = [
  ...PRIMARY_WORKS.map(buildPrimaryWork),
  ...Array.from({ length: EXTRA_WORK_COUNT }, (_, index) =>
    buildExtraWork(index + 9),
  ),
];

/** Responsive bubble count — always keeps the seven visible recommendations */
export function getWorkBubblesForContainer(width: number): WorkBubble[] {
  const primary = WORK_BUBBLES.filter((work) => work.id <= 8);
  const extras = WORK_BUBBLES.filter((work) => work.id > 8);

  let extraCount = EXTRA_WORK_COUNT;

  if (width < 480) {
    extraCount = 55;
  } else if (width < 768) {
    extraCount = 72;
  }

  return [...primary, ...extras.slice(0, extraCount)];
}

export const ALWAYS_VISIBLE_COUNT = WORK_BUBBLES.filter(
  (work) => work.alwaysVisible,
).length;

export const TOTAL_BUBBLE_COUNT = WORK_BUBBLES.length;
