"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

import { useMediaSearch } from "@/hooks/use-media-search";

export function ExploreSearchHydrator() {
  const searchParams = useSearchParams();
  const { setQuery } = useMediaSearch();

  useEffect(() => {
    const urlQuery = searchParams.get("q");
    if (urlQuery !== null) {
      setQuery(urlQuery);
    }
  }, [searchParams, setQuery]);

  return null;
}
