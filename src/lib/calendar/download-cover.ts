import type { MediaItem } from "@/types/media";

const COVER_GRADIENT_MAP: Record<string, [string, string, string]> = {
  "from-emerald-900 via-teal-900 to-slate-950": ["#064e3b", "#134e4a", "#020617"],
  "from-stone-700 via-stone-900 to-neutral-950": ["#44403c", "#1c1917", "#0a0a0a"],
  "from-cyan-900 via-teal-950 to-slate-950": ["#164e63", "#042f2e", "#020617"],
  "from-indigo-900 via-violet-900 to-slate-950": ["#312e81", "#4c1d95", "#020617"],
};

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function downloadMediaCover(item: MediaItem): void {
  const [from, via, to] =
    COVER_GRADIENT_MAP[item.cover] ?? ["#134e4a", "#0f766e", "#020617"];

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="900" viewBox="0 0 600 900">
  <defs>
    <linearGradient id="cover" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${from}" />
      <stop offset="50%" stop-color="${via}" />
      <stop offset="100%" stop-color="${to}" />
    </linearGradient>
  </defs>
  <rect width="600" height="900" fill="url(#cover)" />
  <rect width="600" height="900" fill="url(#cover)" opacity="0.9" />
  <text x="40" y="820" fill="rgba(255,255,255,0.92)" font-family="Georgia, serif" font-size="34">${escapeXml(item.title)}</text>
</svg>`;

  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${item.title.replace(/\s+/g, "-").toLowerCase()}-cover.svg`;
  anchor.click();
  URL.revokeObjectURL(url);
}
