"use client";

import { MediaSearchBar } from "@/components/explore/media-search-bar";
import { cn } from "@/lib/utils";

type SearchBarProps = {
  className?: string;
  placeholder?: string;
};

export function SearchBar({ className, placeholder }: SearchBarProps) {
  return (
    <MediaSearchBar
      className={cn(className)}
      placeholder={placeholder}
      inputId="explore-search"
      variant="explore"
    />
  );
}
