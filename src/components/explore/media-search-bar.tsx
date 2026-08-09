"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

import { useLanguage } from "@/components/i18n/language-provider";
import { MediaSearchResults } from "@/components/explore/media-search-results";
import { useMediaSearch } from "@/hooks/use-media-search";
import { buildExploreSearchHref, persistSearchQuery } from "@/lib/content/search";
import { cn } from "@/lib/utils";

type MediaSearchBarProps = {
  className?: string;
  placeholder?: string;
  inputId?: string;
  variant?: "explore" | "home";
};

export function MediaSearchBar({
  className,
  placeholder,
  inputId = "media-search",
  variant = "explore",
}: MediaSearchBarProps) {
  const router = useRouter();
  const { query, setQuery, results } = useMediaSearch();
  const [focused, setFocused] = useState(false);
  const { t } = useLanguage();
  const resolvedPlaceholder = placeholder ?? t("nav.search");

  const showResults =
    query.trim().length > 0 && (focused || variant === "explore");

  const handleExplore = () => {
    persistSearchQuery(query);
    router.push(buildExploreSearchHref(query));
  };

  return (
    <div className={cn("relative", className)}>
      <label className="sr-only" htmlFor={inputId}>
        {t("nav.search")}
      </label>
      <div
        className={cn(
          "flex items-center justify-between text-white",
          variant === "home"
            ? cn(
                "rounded-full border border-white/10 bg-[#0D1117]/88 px-6 py-4",
                "shadow-[0_8px_32px_rgba(0,0,0,0.32)] backdrop-blur-xl",
              )
            : cn(
                "gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-3",
                "shadow-[0_4px_24px_rgba(0,0,0,0.12)] backdrop-blur-md",
              ),
          focused && variant === "explore" && "border-white/14 bg-white/[0.06]",
          focused && variant === "home" && "border-white/14",
        )}
      >
        <div
          className={cn(
            "flex min-w-0 flex-1 items-center gap-3 text-white/40",
            variant === "home" && "pr-3",
          )}
        >
          <Search
            className={cn("shrink-0", variant === "home" ? "size-5" : "size-4")}
            aria-hidden="true"
          />
          <input
            id={inputId}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => {
              window.setTimeout(() => setFocused(false), 150);
            }}
            placeholder={resolvedPlaceholder}
            className={cn(
              "min-w-0 flex-1 bg-transparent text-white/82 placeholder:text-white/35 outline-none",
              variant === "home" ? "text-sm md:text-base" : "text-sm",
            )}
          />
        </div>

        {variant === "home" && (
          <button
            type="button"
            onClick={handleExplore}
            className="flex shrink-0 items-center gap-1 rounded-full bg-white/10 px-4 py-2 text-sm transition hover:bg-white/20"
          >
            {t("nav.explore")}
            <span aria-hidden="true">→</span>
          </button>
        )}
      </div>

      {showResults && (
        <MediaSearchResults
          results={results}
          query={query}
          onNavigate={() => setFocused(false)}
        />
      )}
    </div>
  );
}
