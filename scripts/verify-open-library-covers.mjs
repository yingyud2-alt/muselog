/**
 * Verifies Open Library cover_i → coverUrl mapping for known titles.
 * Run: node scripts/verify-open-library-covers.mjs
 */

function coercePositiveInt(value) {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return Math.floor(value);
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value.trim());
    if (Number.isFinite(parsed) && parsed > 0) return Math.floor(parsed);
  }
  return null;
}

function buildOpenLibraryCoverUrl(doc) {
  const coverId =
    coercePositiveInt(doc.cover_i) ??
    coercePositiveInt(
      Array.isArray(doc.covers)
        ? doc.covers.find((value) => coercePositiveInt(value) != null)
        : null,
    );
  if (coverId != null) {
    return `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`;
  }
  const editionKey = doc.cover_edition_key?.trim();
  if (editionKey) {
    return `https://covers.openlibrary.org/b/olid/${editionKey}-L.jpg`;
  }
  const isbn = doc.isbn?.find((value) => value?.trim())?.trim();
  if (isbn) {
    return `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;
  }
  return null;
}

function resolveCoverUrl(...candidates) {
  const cleaned = candidates
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter(Boolean);
  const remote = cleaned.find(
    (value) =>
      (value.startsWith("https://") ||
        value.startsWith("http://") ||
        value.startsWith("/") ||
        value.startsWith("data:")) &&
      !value.includes("from-") &&
      !value.includes("via-") &&
      !value.includes("to-"),
  );
  return remote ?? cleaned[0] ?? "from-slate-800 via-slate-900 to-black";
}

const FIXTURES = [
  {
    title: "Kafka on the Shore",
    cover_i: 8231851,
  },
  {
    title: "The Little Prince",
    cover_i: "9255566",
  },
  {
    title: "Norwegian Wood",
    cover_i: 8231992,
  },
];

let failed = 0;

for (const doc of FIXTURES) {
  const coverUrl = buildOpenLibraryCoverUrl(doc);
  const expected = `https://covers.openlibrary.org/b/id/${Number(doc.cover_i)}-L.jpg`;
  const mappedOk = coverUrl === expected;

  // Adapter survival: empty stored cover must not wipe Open Library URL.
  const libraryCover = resolveCoverUrl("", coverUrl, "from-slate-800 via-slate-900 to-black");
  const adapterOk = libraryCover === expected;

  const ok = mappedOk && adapterOk;
  console.log(
    `${ok ? "OK" : "FAIL"}  ${doc.title}\n       mapped=${coverUrl}\n       library=${libraryCover}`,
  );
  if (!ok) failed += 1;
}

// Empty-string regression: previously `??` kept "" and blocked coverUrl.
const emptyBlocked = resolveCoverUrl(
  "",
  "https://covers.openlibrary.org/b/id/1-L.jpg",
);
if (emptyBlocked !== "https://covers.openlibrary.org/b/id/1-L.jpg") {
  console.log("FAIL  empty-string cover fallback");
  failed += 1;
} else {
  console.log("OK  empty-string cover fallback");
}

if (failed > 0) process.exit(1);
console.log("\nCover mapping checks passed.");
