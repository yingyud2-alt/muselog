"use client";

import { useLanguage } from "@/components/i18n/language-provider";
import type { NavSubtitleKey, NavTitleKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type NavLabelProps = {
  titleKey: NavTitleKey;
  subtitleKey: NavSubtitleKey;
  /** desktop pill vs compact mobile bottom bar */
  variant?: "desktop" | "mobile";
  className?: string;
};

/**
 * zh-CN: Chinese primary + English subtitle.
 * en-US: English-only (subtitle keys are empty — no empty line).
 */
export function NavLabel({
  titleKey,
  subtitleKey,
  variant = "desktop",
  className,
}: NavLabelProps) {
  const { t } = useLanguage();
  const primary = t(titleKey);
  const subtitle = t(subtitleKey).trim();

  if (!subtitle) {
    return (
      <span
        className={cn(
          "font-display font-bold leading-none",
          variant === "desktop" && "text-[11px] sm:text-xs",
          variant === "mobile" && "text-[10px] tracking-wide",
          className,
        )}
      >
        {primary}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "flex flex-col items-center justify-center leading-none",
        className,
      )}
    >
      <span
        className={cn(
          "font-display font-medium",
          variant === "desktop" && "text-[12px] sm:text-[13px]",
          variant === "mobile" && "text-[10px] font-bold tracking-wide",
        )}
      >
        {primary}
      </span>
      <span
        className={cn(
          "font-display uppercase text-white/35",
          variant === "desktop" && "mt-0.5 text-[9px] tracking-[0.12em]",
          variant === "mobile" && "mt-0.5 text-[8px] tracking-[0.1em]",
        )}
      >
        {subtitle}
      </span>
    </span>
  );
}
