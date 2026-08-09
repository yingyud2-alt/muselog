"use client";

import { useLanguage } from "@/components/i18n/language-provider";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type LanguageSwitcherProps = {
  className?: string;
  /** denser control for bottom mobile nav */
  compact?: boolean;
};

const OPTIONS: Array<{ locale: Locale; labelKey: "language.zh" | "language.en" }> =
  [
    { locale: "zh-CN", labelKey: "language.zh" },
    { locale: "en-US", labelKey: "language.en" },
  ];

export function LanguageSwitcher({
  className,
  compact = false,
}: LanguageSwitcherProps) {
  const { locale, setLocale, t } = useLanguage();

  return (
    <div
      role="group"
      aria-label={t("language.label")}
      className={cn(
        "inline-flex items-center rounded-full border border-white/[0.08] bg-white/[0.03] p-0.5",
        className,
      )}
    >
      {OPTIONS.map((option) => {
        const active = locale === option.locale;
        return (
          <button
            key={option.locale}
            type="button"
            aria-pressed={active}
            onClick={() => setLocale(option.locale)}
            className={cn(
              "rounded-full font-display font-bold tracking-wide transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300/25",
              compact
                ? "px-1.5 py-0.5 text-[9px]"
                : "px-2 py-0.5 text-[10px] sm:text-[11px]",
              active
                ? "bg-white/[0.08] text-white/82"
                : "text-white/38 hover:text-white/62",
            )}
          >
            {t(option.labelKey)}
          </button>
        );
      })}
    </div>
  );
}
