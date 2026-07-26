import type { WorkBubble } from "@/components/dashboard/mood-bubble-data";

type ActionLabels = {
  addToJournal: string;
  want: string;
  wantActive: string;
  completedRate: string;
  continueInJournal: string;
  ongoing: string;
  finishRate: string;
  viewInJournal: string;
  finished: string;
  ratingTitle: string;
  completedDateLabel: string;
  reviewPlaceholder: string;
};

const BOOK_LABELS: ActionLabels = {
  addToJournal: "Add to Journal",
  want: "Want to Read",
  wantActive: "In Reading List",
  completedRate: "Mark as Read & Rate",
  continueInJournal: "Continue in Journal",
  ongoing: "Reading",
  finishRate: "Finish & Rate",
  viewInJournal: "View in Journal",
  finished: "Finished",
  ratingTitle: "Finished reading?",
  completedDateLabel: "Completed date",
  reviewPlaceholder: "Optional short review",
};

const MOVIE_LABELS: ActionLabels = {
  addToJournal: "Add to Journal",
  want: "Want to Watch",
  wantActive: "In Watchlist",
  completedRate: "Mark as Watched & Rate",
  continueInJournal: "Continue in Journal",
  ongoing: "Watching",
  finishRate: "Finish & Rate",
  viewInJournal: "View in Journal",
  finished: "Finished",
  ratingTitle: "Finished watching?",
  completedDateLabel: "Watched date",
  reviewPlaceholder: "Optional short review",
};

const MUSIC_LABELS: ActionLabels = {
  addToJournal: "Add to Journal",
  want: "Want to Listen",
  wantActive: "In Listening List",
  completedRate: "Mark as Listened & Rate",
  continueInJournal: "Continue in Journal",
  ongoing: "Listening",
  finishRate: "Finish & Rate",
  viewInJournal: "View in Journal",
  finished: "Finished",
  ratingTitle: "Finished listening?",
  completedDateLabel: "Listened date",
  reviewPlaceholder: "Optional short review",
};

export function getBubbleActionLabels(type: WorkBubble["type"]): ActionLabels {
  if (type === "MOVIE" || type === "TV") return MOVIE_LABELS;
  if (type === "MUSIC" || type === "PODCAST") return MUSIC_LABELS;
  return BOOK_LABELS;
}

export function getCompactRateLabel(type: WorkBubble["type"]): string {
  if (type === "MOVIE" || type === "TV") return "Watched & Rate";
  if (type === "MUSIC" || type === "PODCAST") return "Listened & Rate";
  return "Read & Rate";
}

export function getCompactWantLabel(type: WorkBubble["type"]): string {
  if (type === "MOVIE" || type === "TV") return "Want to Watch";
  if (type === "MUSIC" || type === "PODCAST") return "Want to Listen";
  return "Want to Read";
}
