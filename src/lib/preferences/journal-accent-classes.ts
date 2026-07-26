/** Shared Tailwind class fragments bound to Journey Palette CSS variables. */

export const journalAccent = {
  border: "border-[color:var(--journal-accent-border)]",
  bg: "bg-[color:var(--journal-accent-bg)]",
  soft: "bg-[color:var(--journal-accent-soft)]",
  text: "text-[color:var(--journal-accent-text)]",
  ring: "focus-visible:ring-[color:var(--journal-accent-ring)]",
  focusBorder: "focus:border-[color:var(--journal-accent-border)]",
  hoverSoft: "hover:bg-[color:var(--journal-accent-soft)]",
  activeChip: [
    "border-[color:var(--journal-accent-border)]",
    "bg-[color:var(--journal-accent-bg)]",
    "text-[color:var(--journal-accent-text)]",
  ].join(" "),
  primaryButton: [
    "border-[color:var(--journal-accent-border)]",
    "bg-[color:var(--journal-accent-bg)]",
    "text-[color:var(--journal-accent-text)]",
    "hover:bg-[color:var(--journal-accent-soft)]",
    "focus-visible:ring-[color:var(--journal-accent-ring)]",
  ].join(" "),
} as const;
