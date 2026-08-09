"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, Film, Headphones, Mic, Tv, X, type LucideIcon } from "lucide-react";

import { BubbleActionPanel, type BubbleSubPanel } from "@/components/dashboard/bubble-action-panel";
import { getBubbleEmotionalMeta } from "@/components/dashboard/bubble-emotional-meta";
import { useBubbleLocalizedDisplay } from "@/components/dashboard/use-bubble-localized-display";
import { useLanguage } from "@/components/i18n/language-provider";
import {
  MEDIA_ACTION_OVERLAY_CLASS,
  MediaActionCover,
  MediaActionModal,
} from "@/components/shared/media-action-modal";
import { translateMoodLabel } from "@/lib/i18n/mood-label";
import { MOBILE_NAV_CLEARANCE } from "@/lib/mobile/nav-items";
import { useBubbleMediaState } from "@/lib/content/user-media-state";
import { cn } from "@/lib/utils";

import { type MediaType, type WorkBubble } from "./mood-bubble-data";
import {
  getBubbleTypography,
  getContentBox,
  type BubbleTextState,
} from "./mood-bubble-text";
import {
  BUBBLE_TEXT_COLORS,
  getModalStyles,
  TEXT_COLORS,
} from "./mood-bubble-visual";

export const MEDIA_ICONS: Record<MediaType, LucideIcon> = {
  BOOK: BookOpen,
  MOVIE: Film,
  MUSIC: Headphones,
  PODCAST: Mic,
  TV: Tv,
};

export function MediaIcon({
  type,
  className,
  style,
}: {
  type: MediaType;
  className?: string;
  style?: React.CSSProperties;
}) {
  const Icon = MEDIA_ICONS[type];

  return <Icon className={className} style={style} aria-hidden="true" />;
}

type BubbleContentProps = {
  work: Pick<
    WorkBubble,
    | "type"
    | "quote"
    | "title"
    | "tags"
    | "mood"
    | "id"
    | "creator"
    | "workId"
    | "localizedTitle"
    | "localizedCreator"
    | "localizedQuote"
  >;
  state: BubbleTextState;
  diameter: number;
  /** Minimal idle state: media type icon only */
  compact?: boolean;
  showMood?: boolean;
  /** Soft content reveal when hover-expanding a non-featured bubble */
  reveal?: boolean;
};

export function BubbleContent({
  work,
  state,
  diameter,
  compact = false,
  showMood = false,
  reveal = false,
}: BubbleContentProps) {
  const { t } = useLanguage();
  const typography = getBubbleTypography(diameter, state);
  const contentBox = getContentBox(diameter, state);
  const isFocused = state === "focused";
  const meta = showMood ? getBubbleEmotionalMeta(work) : null;
  const display = useBubbleLocalizedDisplay(work);
  const iconSize = Math.max(
    12,
    Math.min(isFocused ? 20 : 16, diameter * (isFocused ? 0.09 : 0.08)),
  );
  const creatorSize = Math.max(8, typography.title - 1.5);
  const showLanguageToggle =
    !compact && display.canToggle && diameter >= 150;

  if (compact) {
    return (
      <div className="pointer-events-none flex h-full w-full items-center justify-center overflow-hidden rounded-full">
        <MediaIcon
          type={work.type}
          className="shrink-0"
          style={{
            width: Math.max(12, Math.min(16, diameter * 0.22)),
            height: Math.max(12, Math.min(16, diameter * 0.22)),
            color: TEXT_COLORS.icon,
            opacity: 0.58,
          }}
        />
      </div>
    );
  }

  const teaserClass = display.isZh
    ? "font-bubble-zh-teaser w-full whitespace-normal break-words [overflow-wrap:anywhere]"
    : "font-display w-full whitespace-normal break-words [overflow-wrap:anywhere]";
  const titleClass = display.isZh
    ? "font-bubble-zh-title w-full whitespace-normal break-words [overflow-wrap:anywhere]"
    : "font-display w-full whitespace-normal break-words [overflow-wrap:anywhere]";

  const body = (
    <div
      className="flex min-h-0 min-w-0 flex-col items-center justify-center text-center leading-snug"
      style={{
        width: contentBox.width,
        maxHeight: contentBox.maxHeight,
        margin: "auto",
      }}
    >
      <MediaIcon
        type={work.type}
        className="shrink-0"
        style={{
          width: iconSize,
          height: iconSize,
          color: TEXT_COLORS.icon,
          opacity: isFocused ? 0.82 : 0.68,
        }}
      />
      <p
        className={teaserClass}
        style={{
          marginTop: typography.typeToQuoteGap,
          fontSize: typography.quote,
          letterSpacing: display.isZh ? "0.01em" : typography.quoteTracking,
          lineHeight: display.isZh ? 1.5 : typography.quoteLineHeight,
          fontWeight: display.isZh ? 400 : typography.quoteFontWeight,
          color: isFocused
            ? BUBBLE_TEXT_COLORS.quoteFocused
            : BUBBLE_TEXT_COLORS.quote,
          opacity: typography.quoteOpacity,
          maxHeight:
            typography.quote *
            (display.isZh ? 1.5 : typography.quoteLineHeight) *
            typography.quoteMaxLines,
          overflow: "hidden",
        }}
      >
        {display.isZh ? (
          display.teaser
        ) : (
          <>
            &ldquo;{display.teaser}&rdquo;
          </>
        )}
      </p>
      <p
        className={titleClass}
        style={{
          marginTop: typography.quoteToTitleGap,
          fontSize: typography.title,
          lineHeight: display.isZh ? 1.3 : typography.titleLineHeight,
          fontWeight: display.isZh ? 500 : typography.titleFontWeight,
          color: isFocused
            ? BUBBLE_TEXT_COLORS.titleFocused
            : BUBBLE_TEXT_COLORS.title,
          opacity: typography.titleOpacity,
          maxHeight:
            typography.title *
            (display.isZh ? 1.3 : typography.titleLineHeight) *
            typography.titleMaxLines,
          overflow: "hidden",
        }}
      >
        {display.title}
      </p>
      {display.creator ? (
        <p
          className="font-display w-full truncate"
          style={{
            marginTop: Math.max(3, typography.quoteToTitleGap * 0.45),
            fontSize: creatorSize,
            lineHeight: 1.2,
            fontWeight: 400,
            color: BUBBLE_TEXT_COLORS.subtitle,
            opacity: isFocused ? 0.72 : 0.58,
          }}
        >
          {display.creator}
        </p>
      ) : null}
      {meta && diameter >= 130 ? (
        <p
          className="font-label mt-1 w-full truncate capitalize"
          style={{
            fontSize: Math.max(8, typography.type - 1),
            letterSpacing: "0.08em",
            color: BUBBLE_TEXT_COLORS.subtitle,
            opacity: 0.45,
          }}
        >
          {translateMoodLabel(t, meta.mood)}
        </p>
      ) : null}
      {showLanguageToggle ? (
        <span
          role="button"
          tabIndex={0}
          aria-label={t(display.toggleLabelKey)}
          className="pointer-events-auto mt-1 cursor-pointer font-label text-[9px] tracking-[0.08em] text-white/40 underline-offset-2 transition hover:text-white/62 hover:underline"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            display.toggle();
          }}
          onKeyDown={(event) => {
            if (event.key !== "Enter" && event.key !== " ") return;
            event.preventDefault();
            event.stopPropagation();
            display.toggle();
          }}
          onPointerDown={(event) => {
            event.stopPropagation();
          }}
        >
          {t(display.toggleLabelKey)}
        </span>
      ) : null}
    </div>
  );

  if (reveal) {
    return (
      <motion.div
        className="pointer-events-none flex h-full w-full items-center justify-center overflow-hidden rounded-full"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24, ease: "easeOut" }}
      >
        {body}
      </motion.div>
    );
  }

  return (
    <div className="pointer-events-none flex h-full w-full items-center justify-center overflow-hidden rounded-full">
      <motion.div
        key={`${display.showOriginal ? "orig" : "zh"}-${display.teaser}`}
        className="flex h-full w-full items-center justify-center"
        initial={{ opacity: 0.72 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.18 }}
      >
        {body}
      </motion.div>
    </div>
  );
}

type RecommendationModalProps = {
  selected: WorkBubble | null;
  onClose: () => void;
};

export function RecommendationModal({
  selected,
  onClose,
}: RecommendationModalProps) {
  const [subPanelByWork, setSubPanelByWork] = useState<
    Record<number, BubbleSubPanel>
  >({});
  const selectedModalStyles = selected ? getModalStyles(selected.color) : null;
  const subPanel = selected ? (subPanelByWork[selected.id] ?? "none") : "none";
  const { state } = useBubbleMediaState(selected);
  const meta = selected ? getBubbleEmotionalMeta(selected) : null;

  const setSubPanel = useCallback((next: BubbleSubPanel) => {
    if (!selected) return;
    setSubPanelByWork((current) => ({ ...current, [selected.id]: next }));
  }, [selected]);

  useEffect(() => {
    if (!selected) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (subPanel !== "none") {
        setSubPanel("none");
        return;
      }
      onClose();
    };

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [selected, subPanel, onClose, setSubPanel]);

  const personalNote = state?.notes || state?.shortReview || state?.quote;

  const handleBackdrop = () => {
    if (subPanel !== "none") {
      setSubPanel("none");
      return;
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {selected && selectedModalStyles && meta && (
        <>
          <motion.button
            type="button"
            aria-label="Close memory"
            className={MEDIA_ACTION_OVERLAY_CLASS}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleBackdrop}
          />

          {/* Desktop: shared glass media-action modal */}
          <MediaActionModal
            ariaLabel={
              subPanel === "journal"
                ? "Add to Journal"
                : subPanel === "rating"
                  ? `${selected.title} rating`
                  : `${selected.title} memory`
            }
            onClose={subPanel !== "none" ? () => setSubPanel("none") : onClose}
            width={subPanel === "none" ? 620 : 580}
            cover={
              <MediaActionCover background={selectedModalStyles.coverBackground}>
                <MediaIcon
                  type={selected.type}
                  className="size-10"
                  style={{ color: TEXT_COLORS.icon, opacity: 0.82 }}
                />
              </MediaActionCover>
            }
          >
            {subPanel === "none" ? (
              <div className="flex h-full flex-col text-left">
                <p
                  className="font-label text-[10px] uppercase tracking-[0.18em]"
                  style={{ color: TEXT_COLORS.type, opacity: 0.48 }}
                >
                  {selected.type}
                </p>

                <h3
                  className="font-display mt-2 text-[24px] font-bold leading-tight"
                  style={{ color: TEXT_COLORS.titleFocused }}
                >
                  {selected.title}
                </h3>

                <p
                  className="font-label mt-1.5 text-[13px]"
                  style={{ color: TEXT_COLORS.subtitle }}
                >
                  {selected.creator}
                </p>

                <p
                  className="font-quote mt-3 text-[14px] italic leading-relaxed"
                  style={{ color: TEXT_COLORS.quoteFocused }}
                >
                  &ldquo;{selected.quote}&rdquo;
                </p>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  <span className="font-label rounded-full border border-white/12 bg-white/[0.05] px-2.5 py-1 text-[10px] capitalize tracking-wide text-white/55">
                    {meta.mood}
                  </span>
                  {meta.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="font-label rounded-full border border-white/[0.08] px-2.5 py-1 text-[10px] text-white/40"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {personalNote ? (
                  <p className="font-body mt-3 line-clamp-3 text-[12px] leading-relaxed text-white/50">
                    {personalNote}
                  </p>
                ) : (
                  <p className="font-body mt-3 text-[12px] text-white/32">
                    A piece of culture that shaped you
                  </p>
                )}

                <div className="mt-auto pt-5">
                  <BubbleActionPanel
                    work={selected}
                    subPanel={subPanel}
                    onSubPanelChange={setSubPanel}
                    presentation="panel"
                  />
                </div>
              </div>
            ) : (
              <BubbleActionPanel
                work={selected}
                subPanel={subPanel}
                onSubPanelChange={setSubPanel}
                presentation="panel"
              />
            )}
          </MediaActionModal>

          {/* Mobile bottom sheet — unchanged presentation */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={`${selected.title} memory`}
            onClick={(event) => event.stopPropagation()}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 360 }}
            className={cn(
              "fixed inset-x-0 bottom-0 z-50 flex max-h-[88svh] flex-col overflow-y-auto md:hidden",
              "muse-dark-panel rounded-t-[28px] border-b-0 p-6 text-center text-white backdrop-blur-2xl",
            )}
            style={{
              background: selectedModalStyles.background,
              border: selectedModalStyles.border,
              boxShadow: selectedModalStyles.boxShadow,
              paddingBottom: `max(24px, ${MOBILE_NAV_CLEARANCE})`,
            }}
          >
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/20" aria-hidden="true" />

            <button
              type="button"
              aria-label="Close memory"
              className="absolute right-4 top-4 z-10 flex size-9 items-center justify-center rounded-full border border-white/10 bg-black/25 text-white/70 transition-opacity hover:opacity-100"
              onClick={onClose}
            >
              <X size={16} />
            </button>

            <div
              className="mx-auto flex h-[116px] w-[116px] items-center justify-center rounded-2xl"
              style={{ background: selectedModalStyles.coverBackground }}
            >
              <MediaIcon
                type={selected.type}
                className="size-[46px]"
                style={{ color: TEXT_COLORS.icon, opacity: 0.82 }}
              />
            </div>

            <p
              className="font-label mt-5 text-[11px] uppercase tracking-[0.18em]"
              style={{ color: TEXT_COLORS.type, opacity: 0.48 }}
            >
              {selected.type}
            </p>

            <h3
              className="font-display mt-2 text-[26px] font-bold leading-tight"
              style={{ color: TEXT_COLORS.titleFocused }}
            >
              {selected.title}
            </h3>

            <p
              className="font-label mt-2 text-[14px]"
              style={{ color: TEXT_COLORS.subtitle }}
            >
              {selected.creator}
            </p>

            <p
              className="font-quote mt-4 text-[15px] italic leading-relaxed"
              style={{ color: TEXT_COLORS.quoteFocused }}
            >
              &ldquo;{selected.quote}&rdquo;
            </p>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5">
              <span className="font-label rounded-full border border-white/12 bg-white/[0.05] px-2.5 py-1 text-[10px] capitalize tracking-wide text-white/55">
                {meta.mood}
              </span>
              {meta.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="font-label rounded-full border border-white/[0.08] px-2.5 py-1 text-[10px] text-white/40"
                >
                  {tag}
                </span>
              ))}
            </div>

            {personalNote ? (
              <p className="font-body mt-4 rounded-2xl border border-white/[0.08] bg-white/[0.04] px-3.5 py-3 text-left text-[13px] leading-relaxed text-white/58">
                {personalNote}
              </p>
            ) : (
              <p className="font-body mt-4 text-[12px] text-white/32">
                A piece of culture that shaped you
              </p>
            )}

            <BubbleActionPanel
              work={selected}
              subPanel={subPanel}
              onSubPanelChange={setSubPanel}
              presentation="nested"
            />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
