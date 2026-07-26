/** Cool muted archive palette — Profile / Journal archive surfaces only. */
export const ARCHIVE = {
  steel: "#6D8FA3",
  mist: "#93ACAA",
  sage: "#6E8682",
  forest: "#455A4F",
  softBlueGrey: "#718096",
  navy: "#0B1219",
  navyElevated: "#101820",
  border: "rgba(109, 143, 163, 0.22)",
  ink: "#F2F5F4",
} as const;

export const ARCHIVE_TOKEN_COLORS = [
  ARCHIVE.steel,
  ARCHIVE.mist,
  ARCHIVE.sage,
  ARCHIVE.softBlueGrey,
] as const;
