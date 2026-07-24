"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  BookOpen,
  Film,
  Headphones,
  Mic,
  Plus,
  Tv,
  X,
  type LucideIcon,
} from "lucide-react";

import { type MediaType, type WorkBubble } from "./mood-bubble-data";
import {
  getBubbleTypography,
  getContentBox,
  type BubbleTextState,
} from "./mood-bubble-text";
import {
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
  work: Pick<WorkBubble, "type" | "quote" | "title">;
  state: BubbleTextState;
  diameter: number;
};

export function BubbleContent({ work, state, diameter }: BubbleContentProps) {
  const typography = getBubbleTypography(diameter, state);
  const contentBox = getContentBox(diameter, state);
  const isFocused = state === "focused";

  return (
    <div className="pointer-events-none flex h-full w-full items-center justify-center overflow-hidden rounded-full">
      <div
        className="flex min-h-0 min-w-0 flex-col items-center justify-center text-center leading-snug"
        style={{
          width: contentBox.width,
          maxHeight: contentBox.maxHeight,
          margin: "auto",
        }}
      >
        <p
          className="w-full whitespace-normal uppercase"
          style={{
            fontSize: typography.type,
            letterSpacing: typography.typeTracking,
            lineHeight: 1.2,
            color: TEXT_COLORS.type,
            opacity: typography.typeOpacity,
          }}
        >
          {work.type}
        </p>
        <p
          className="w-full whitespace-normal break-words italic [overflow-wrap:anywhere]"
          style={{
            marginTop: typography.typeToQuoteGap,
            fontSize: typography.quote,
            lineHeight: typography.quoteLineHeight,
            fontWeight: typography.quoteFontWeight,
            color: isFocused ? TEXT_COLORS.quoteFocused : TEXT_COLORS.quote,
            opacity: typography.quoteOpacity,
            maxHeight:
              typography.quote *
              typography.quoteLineHeight *
              typography.quoteMaxLines,
            overflow: "hidden",
          }}
        >
          &ldquo;{work.quote}&rdquo;
        </p>
        <p
          className="w-full whitespace-normal break-words [overflow-wrap:anywhere]"
          style={{
            marginTop: typography.quoteToTitleGap,
            fontSize: typography.title,
            lineHeight: typography.titleLineHeight,
            fontWeight: typography.titleFontWeight,
            color: isFocused ? TEXT_COLORS.titleFocused : TEXT_COLORS.title,
            opacity: typography.titleOpacity,
            maxHeight:
              typography.title *
              typography.titleLineHeight *
              typography.titleMaxLines,
            overflow: "hidden",
          }}
        >
          {work.title}
        </p>
      </div>
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
  const selectedModalStyles = selected ? getModalStyles(selected.color) : null;

  return (
    <AnimatePresence>
      {selected && selectedModalStyles && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-5 backdrop-blur-xl pt-[max(24px,env(safe-area-inset-top))] pb-[max(24px,env(safe-area-inset-bottom))] md:p-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            onClick={(event) => event.stopPropagation()}
            className="relative w-[calc(100vw-40px)] max-h-[calc(100svh-56px)] max-w-[380px] overflow-y-auto rounded-[28px] p-[24px] text-center text-white backdrop-blur-2xl md:mx-4 md:max-h-none md:w-full md:max-w-[360px] md:rounded-3xl md:p-8"
            style={{
              background: selectedModalStyles.background,
              border: selectedModalStyles.border,
              boxShadow: selectedModalStyles.boxShadow,
            }}
          >
            <button
              type="button"
              aria-label="Close recommendation"
              className="absolute right-4 top-4 flex size-10 items-center justify-center opacity-70 transition-opacity hover:opacity-100 md:right-5 md:top-5 md:size-auto"
              style={{ color: TEXT_COLORS.icon }}
              onClick={onClose}
            >
              <X size={18} />
            </button>

            <div
              className="mx-auto flex h-[116px] w-[116px] items-center justify-center rounded-2xl md:h-44 md:w-full"
              style={{ background: selectedModalStyles.coverBackground }}
            >
              <MediaIcon
                type={selected.type}
                className="size-[46px] md:size-[50px]"
                style={{ color: TEXT_COLORS.icon, opacity: 0.82 }}
              />
            </div>

            <p
              className="mt-6 text-[11px] uppercase md:mt-6 md:text-xs"
              style={{
                color: TEXT_COLORS.type,
                letterSpacing: "0.18em",
                opacity: 0.48,
              }}
            >
              {selected.type}
            </p>

            <h3
              className="mt-2 text-[26px] font-semibold leading-tight md:mt-3 md:text-3xl"
              style={{ color: TEXT_COLORS.titleFocused }}
            >
              {selected.title}
            </h3>

            <p
              className="mt-2 text-[14px] md:text-sm"
              style={{ color: TEXT_COLORS.subtitle }}
            >
              {selected.creator}
            </p>

            <p
              className="mt-5 text-[15px] italic leading-relaxed md:mt-5 md:text-[15px] md:leading-snug"
              style={{
                color: TEXT_COLORS.quoteFocused,
                fontWeight: 500,
              }}
            >
              &ldquo;{selected.quote}&rdquo;
            </p>

            <button
              type="button"
              className="mt-7 flex h-[52px] w-full items-center justify-center gap-2 rounded-full bg-white/95 text-black transition-colors hover:bg-white md:mt-8 md:h-auto md:py-3"
            >
              <Plus size={18} />
              Add to journal
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
