"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { RefreshCw, WandSparkles, X } from "lucide-react";

import { MemoryCover } from "@/components/calendar/memory-cover";
import {
  getModalStyles,
  PALETTE,
  TEXT_COLORS,
} from "@/components/dashboard/mood-bubble-visual";
import { CONTENT_CATALOG } from "@/lib/content/content-data";
import {
  buildJournalItemFromMediaKey,
  resolveJournalItemId,
} from "@/lib/content/bubble-content-bridge";
import type { Content, ContentType } from "@/lib/content/types";
import {
  removeUserMediaState,
  syncMemoryFromUserState,
  upsertUserMediaState,
  useUserMediaStateMap,
} from "@/lib/content/user-media-state";
import { useJournalEntries } from "@/lib/calendar/journal-store";
import { getDisplayTodayString } from "@/lib/habit/habit-utils";
import { CONTENT_TYPE_LABELS } from "@/lib/content/constants";
import { cn } from "@/lib/utils";

const SURPRISE_MODAL_Z = 60;

function pickRandomContent(excludeId?: string): Content {
  const pool = CONTENT_CATALOG.filter((entry) => entry.id !== excludeId);
  const index = Math.floor(Math.random() * pool.length);
  return pool[index] ?? CONTENT_CATALOG[0];
}

function getContentModalColor(type: ContentType): string {
  if (type === "BOOK") return PALETTE.forest;
  if (type === "MOVIE") return PALETTE.slate;
  return PALETTE.sage;
}

function useSurpriseContentState(content: Content | null) {
  const stateMap = useUserMediaStateMap();
  const { entries, addEntry } = useJournalEntries();

  const mediaKey = content?.id ?? "";
  const journalItemId = resolveJournalItemId(mediaKey);
  const journalItem = useMemo(
    () => entries.find((entry) => entry.id === journalItemId) ?? null,
    [entries, journalItemId],
  );
  const stored = mediaKey ? stateMap[mediaKey] : undefined;

  const isWant = stored?.status === "WANT" && !journalItem;
  const isInJournal = Boolean(journalItem);

  const addToWant = useCallback(() => {
    if (!content) return;

    if (isWant) {
      removeUserMediaState(mediaKey);
      syncMemoryFromUserState(mediaKey, {
        mediaKey,
        status: "NONE",
        addedToJournal: false,
      });
      return;
    }

    if (isInJournal) return;

    const next = {
      mediaKey,
      status: "WANT" as const,
      addedToJournal: false,
      title: content.title,
      creator: content.creator,
      cover: content.cover,
      mediaType: content.type,
      quote: content.description,
    };

    upsertUserMediaState(mediaKey, next);
    syncMemoryFromUserState(mediaKey, next);
  }, [content, isInJournal, isWant, mediaKey]);

  const addToJournal = useCallback(() => {
    if (!content || isInJournal) return;

    const today = getDisplayTodayString();
    const item = buildJournalItemFromMediaKey(mediaKey, {
      status: "READING",
      date: today,
      startDate: today,
      note: "",
    });

    addEntry(item);

    const next = {
      mediaKey,
      status: "ONGOING" as const,
      addedToJournal: true,
      title: content.title,
      creator: content.creator,
      cover: content.cover,
      mediaType: content.type,
      quote: content.description,
      startDate: today,
    };

    upsertUserMediaState(mediaKey, next);
    syncMemoryFromUserState(mediaKey, next);
  }, [addEntry, content, isInJournal, mediaKey]);

  return { isWant, isInJournal, addToWant, addToJournal };
}

type SurpriseMuseModalProps = {
  content: Content;
  onClose: () => void;
  onRefresh: () => void;
};

function SurpriseMuseModal({
  content,
  onClose,
  onRefresh,
}: SurpriseMuseModalProps) {
  const { isWant, isInJournal, addToWant, addToJournal } =
    useSurpriseContentState(content);
  const modalStyles = getModalStyles(getContentModalColor(content.type));

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return createPortal(
    <motion.div
      className="fixed inset-0 flex items-center justify-center bg-black/70 px-5 backdrop-blur-xl md:p-0"
      style={{ zIndex: SURPRISE_MODAL_Z }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        onClick={(event) => event.stopPropagation()}
        className="relative w-[calc(100vw-40px)] max-h-[min(calc(100svh-120px),720px)] max-w-[380px] overflow-y-auto rounded-[28px] p-[24px] text-center text-white backdrop-blur-2xl md:mx-4 md:max-h-none md:w-full md:max-w-[360px] md:rounded-3xl md:p-8"
        style={{
          background: modalStyles.background,
          border: modalStyles.border,
          boxShadow: modalStyles.boxShadow,
        }}
        initial={{ opacity: 0, scale: 0.94, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
      >
        <button
          type="button"
          aria-label="Close surprise"
          className="absolute right-4 top-4 flex size-10 items-center justify-center opacity-70 transition-opacity hover:opacity-100 md:right-5 md:top-5 md:size-auto"
          style={{ color: TEXT_COLORS.icon }}
          onClick={onClose}
        >
          <X size={18} />
        </button>

        <div className="mx-auto w-[140px] md:w-[176px]">
          <MemoryCover
            cover={content.cover}
            title={content.title}
            className="w-full rounded-2xl"
            overlay="deep"
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
          {CONTENT_TYPE_LABELS[content.type]}
        </p>

        <h3
          className="mt-2 text-[26px] font-semibold leading-tight md:mt-3 md:text-3xl"
          style={{ color: TEXT_COLORS.titleFocused }}
        >
          {content.title}
        </h3>

        <p
          className="mt-2 text-[14px] md:text-sm"
          style={{ color: TEXT_COLORS.subtitle }}
        >
          {content.creator}
        </p>

        <p
          className="mt-5 text-[15px] italic leading-relaxed md:mt-5 md:text-[15px] md:leading-snug"
          style={{
            color: TEXT_COLORS.quoteFocused,
            fontWeight: 500,
          }}
        >
          &ldquo;{content.description}&rdquo;
        </p>

        <div className="mt-7 space-y-2.5 md:mt-8">
          <button
            type="button"
            disabled={isInJournal}
            onClick={addToJournal}
            className={cn(
              "flex h-[52px] w-full items-center justify-center rounded-full text-sm font-medium transition md:h-auto md:py-3",
              isInJournal
                ? "cursor-default bg-white/20 text-white/45"
                : "bg-white/95 text-black hover:bg-white",
            )}
          >
            {isInJournal ? "Added to Journal" : "Add to Journal"}
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={isInJournal}
              onClick={addToWant}
              className={cn(
                "flex h-[46px] items-center justify-center rounded-full border px-2 text-[13px] transition md:h-auto md:py-2.5 md:text-sm",
                isInJournal
                  ? "cursor-default border-white/8 text-white/35"
                  : isWant
                    ? "border-white/24 bg-white/[0.06] text-white/78"
                    : "border-white/16 bg-transparent text-white/72 hover:bg-white/[0.05]",
              )}
            >
              {isWant ? "On Want List" : "Add to Want List"}
            </button>

            <button
              type="button"
              onClick={onRefresh}
              className="flex h-[46px] items-center justify-center gap-1.5 rounded-full border border-white/16 bg-white/[0.08] px-2 text-[13px] text-white/82 transition hover:bg-white/[0.12] md:h-auto md:py-2.5 md:text-sm"
            >
              <RefreshCw className="size-3.5 shrink-0" aria-hidden="true" />
              Refresh
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>,
    document.body,
  );
}

export function SurpriseMuseButton() {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState<Content | null>(null);

  const reveal = useCallback(() => {
    setContent((current) => pickRandomContent(current?.id));
    setOpen(true);
  }, []);

  const refresh = useCallback(() => {
    setContent((current) => pickRandomContent(current?.id));
  }, []);

  const close = useCallback(() => {
    setOpen(false);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={reveal}
        className={cn(
          "inline-flex items-center gap-2.5 rounded-full",
          "border border-teal-300/18 bg-[rgba(20,40,42,0.6)]",
          "px-5 py-3 text-sm font-medium text-teal-50/88",
          "shadow-[0_8px_28px_rgba(30,70,72,0.2)] backdrop-blur-md",
          "transition hover:border-teal-200/28",
          "hover:shadow-[0_10px_36px_rgba(50,100,98,0.28)]",
          "hover:text-white/92",
        )}
      >
        <WandSparkles
          className="size-[18px] text-teal-200/75"
          strokeWidth={1.75}
          aria-hidden="true"
        />
        Surprise Muse
      </button>

      {open && content && typeof document !== "undefined" && (
        <SurpriseMuseModal
          content={content}
          onClose={close}
          onRefresh={refresh}
        />
      )}
    </>
  );
}
