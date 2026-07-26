"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search, X } from "lucide-react";

import {
  JournalEntryForm,
  type JournalEntryDraft,
  type JournalMediaSelection,
} from "@/components/calendar/journal-entry-form";
import { MemoryCover } from "@/components/calendar/memory-cover";
import { formatCardDate } from "@/lib/calendar/utils";
import { useCalendarMedia } from "@/lib/calendar/use-calendar-media";
import {
  getDefaultWaitingTab,
  getWaitingList,
  type WaitingTab,
} from "@/lib/calendar/journal-waiting-list";
import {
  buildJournalItemFromMediaKey,
  resolveJournalItemId,
} from "@/lib/content/bubble-content-bridge";
import { CONTENT_TYPE_LABELS } from "@/lib/content/constants";
import {
  contentToSelection,
  searchJournalCatalog,
} from "@/lib/calendar/journal-recommendations";
import {
  syncMemoryFromUserState,
  upsertUserMediaState,
  type UserMediaStatus,
} from "@/lib/content/user-media-state";
import type { MediaItem, MediaStatus } from "@/types/media";
import { cn } from "@/lib/utils";

type JournalAddPanelProps = {
  date: string | null;
  journalItems: MediaItem[];
  onClose: () => void;
};

type PanelStep = "pick" | "configure";

const WAITING_TABS: { id: WaitingTab; label: string }[] = [
  { id: "read", label: "Want to Read" },
  { id: "watch", label: "Want to Watch" },
  { id: "listen", label: "Want to Listen" },
];

const GLASS_PANEL =
  "border border-white/[0.1] bg-white/[0.055] shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-2xl";

const LIGHT_OVERLAY =
  "bg-[#0D1117]/20 backdrop-blur-[8px] saturate-[1.15]";

function draftStatusToMediaStatus(
  status: JournalEntryDraft["status"],
): MediaStatus {
  if (status === "WANT") return "WANT";
  if (status === "ONGOING") return "READING";
  return "FINISHED";
}

export function JournalAddPanel({
  date,
  journalItems,
  onClose,
}: JournalAddPanelProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const { addJournalEntry, saveJourney } = useCalendarMedia();
  const [step, setStep] = useState<PanelStep>("pick");
  const [selection, setSelection] = useState<JournalMediaSelection | null>(null);
  const [query, setQuery] = useState("");
  const [waitingTab, setWaitingTab] = useState<WaitingTab>(() =>
    getDefaultWaitingTab(journalItems),
  );

  const handleClose = useCallback(() => {
    setStep("pick");
    setSelection(null);
    setQuery("");
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!date) return;

    closeRef.current?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") handleClose();
    };

    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [date, handleClose]);

  const catalogSearch = useMemo(
    () => searchJournalCatalog(query, journalItems),
    [journalItems, query],
  );

  const waitingItems = useMemo(
    () => getWaitingList(journalItems, waitingTab).slice(0, 8),
    [journalItems, waitingTab],
  );

  const handleSave = useCallback(
    (draft: JournalEntryDraft) => {
      const mediaStatus = draftStatusToMediaStatus(draft.status);
      const journalItemId = resolveJournalItemId(draft.mediaKey);
      const effectiveEnd = draft.endDate ?? draft.startDate;

      const item = buildJournalItemFromMediaKey(
        draft.mediaKey,
        {
          status: mediaStatus,
          date: draft.startDate,
          startDate: draft.startDate,
          endDate:
            draft.endDate && draft.endDate !== draft.startDate
              ? draft.endDate
              : undefined,
          journeyColor: draft.journeyColor,
          rating: draft.rating,
          note: draft.note,
          quote: draft.quote,
        },
        {
          title: draft.title,
          creator: draft.creator,
          cover: draft.cover,
          type: draft.type,
          quote: draft.quote,
        },
      );

      addJournalEntry(item);
      saveJourney(journalItemId, draft.startDate, effectiveEnd, draft.journeyColor);

      const userStatus: UserMediaStatus = draft.status;
      const next = {
        mediaKey: draft.mediaKey,
        status: userStatus,
        addedToJournal: true,
        startDate: draft.startDate,
        endDate: draft.endDate,
        journeyColor: draft.journeyColor,
        rating: draft.rating > 0 ? draft.rating : undefined,
        shortReview: draft.note || undefined,
        notes: draft.note || undefined,
        quote: draft.quote || undefined,
        title: draft.title,
        creator: draft.creator,
        cover: draft.cover,
        mediaType: draft.type,
      };

      upsertUserMediaState(draft.mediaKey, next);
      syncMemoryFromUserState(draft.mediaKey, next);
      handleClose();
    },
    [addJournalEntry, handleClose, saveJourney],
  );

  const pickContent = date ? (
    <JournalAddPickStep
      query={query}
      onQueryChange={setQuery}
      catalogSearch={catalogSearch}
      waitingTab={waitingTab}
      onWaitingTabChange={setWaitingTab}
      waitingItems={waitingItems}
      onSelect={(item) => {
        setSelection(item);
        setStep("configure");
      }}
    />
  ) : null;

  const configureContent =
    date && selection ? (
      <JournalEntryForm
        key={`${selection.mediaKey}-${date}`}
        selection={selection}
        startDate={date}
        onSave={handleSave}
        onBack={() => {
          setSelection(null);
          setStep("pick");
        }}
        onCancel={handleClose}
      />
    ) : null;

  return (
    <AnimatePresence>
      {date && (
        <>
          <motion.button
            type="button"
            aria-label="Close add panel"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={handleClose}
            className={cn("fixed inset-0 z-50", LIGHT_OVERLAY)}
          />

          {/* Desktop floating glass panel */}
          <div className="pointer-events-none fixed inset-0 z-50 hidden items-center justify-center p-8 md:flex">
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Add to this memory"
              initial={{ opacity: 0, y: 18, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.99 }}
              transition={{ type: "spring", damping: 30, stiffness: 320 }}
              className={cn(
                "pointer-events-auto flex max-h-[min(82svh,720px)] w-[min(76vw,880px)] flex-col overflow-hidden rounded-[28px]",
                GLASS_PANEL,
              )}
            >
              <JournalAddPanelHeader
                date={date}
                step={step}
                closeRef={closeRef}
                onClose={handleClose}
              />
              <div
                key={date}
                className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-7 py-5"
              >
                {step === "pick" ? pickContent : configureContent}
              </div>
            </motion.div>
          </div>

          {/* Mobile bottom sheet */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Add to this memory"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 360 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.05, bottom: 0.35 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 96 || info.velocity.y > 600) handleClose();
            }}
            className={cn(
              "fixed inset-x-0 bottom-0 z-50 flex max-h-[88svh] flex-col md:hidden",
              "rounded-t-[24px] border border-white/10 border-b-0",
              GLASS_PANEL,
            )}
          >
            <div className="relative shrink-0 pt-3">
              <div className="mx-auto h-1 w-10 rounded-full bg-white/20" aria-hidden="true" />
              <button
                ref={closeRef}
                type="button"
                aria-label="Close"
                onClick={handleClose}
                className="absolute right-4 top-3 flex size-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-white/75"
              >
                <X className="size-3.5" />
              </button>
            </div>
            <JournalAddPanelHeader
              date={date}
              step={step}
              compact
              onClose={handleClose}
            />
            <div
              key={date}
              className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-[calc(env(safe-area-inset-bottom)+20px)] pt-2"
            >
              {step === "pick" ? pickContent : configureContent}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function JournalAddPanelHeader({
  date,
  step,
  closeRef,
  compact = false,
  onClose,
}: {
  date: string;
  step: PanelStep;
  closeRef?: React.RefObject<HTMLButtonElement | null>;
  compact?: boolean;
  onClose: () => void;
}) {
  return (
    <div
      className={cn(
        "relative shrink-0 border-b border-white/[0.06]",
        compact ? "px-5 pb-3 pt-1" : "px-7 pb-4 pt-5",
      )}
    >
      {!compact && closeRef && (
        <button
          ref={closeRef}
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute right-5 top-5 flex size-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-white/75 transition-colors hover:bg-white/[0.1]"
        >
          <X className="size-3.5" />
        </button>
      )}

      <p className="text-xs text-white/40">{formatCardDate(date)}</p>
      <h2 className="mt-1 text-xl font-semibold tracking-tight text-white/94">
        {step === "pick" ? "Add to this memory" : "Shape this memory"}
      </h2>
      <p className="mt-1 text-sm text-white/48">
        {step === "pick"
          ? "Choose something you want to read, watch, or listen to."
          : "Set your timeline and how this work lives in your journal."}
      </p>
    </div>
  );
}

function JournalAddPickStep({
  query,
  onQueryChange,
  catalogSearch,
  waitingTab,
  onWaitingTabChange,
  waitingItems,
  onSelect,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  catalogSearch: ReturnType<typeof searchJournalCatalog>;
  waitingTab: WaitingTab;
  onWaitingTabChange: (tab: WaitingTab) => void;
  waitingItems: ReturnType<typeof getWaitingList>;
  onSelect: (selection: JournalMediaSelection) => void;
}) {
  const hasQuery = query.trim().length > 0;

  return (
    <div className="space-y-8">
      <section>
        <p className="text-[10px] uppercase tracking-[0.16em] text-white/35">
          Search & Discover
        </p>
        <div className="mt-3 flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-3.5 backdrop-blur-md">
          <Search className="size-4 shrink-0 text-white/35" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search books, movies, music..."
            className="min-w-0 flex-1 bg-transparent text-sm text-white/85 placeholder:text-white/35 outline-none"
          />
        </div>

        {hasQuery && (
          <div className="mt-4 space-y-4">
            {catalogSearch.directMatches.length === 0 &&
            catalogSearch.recommendations.length === 0 ? (
              <p className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-6 text-sm text-white/45">
                No matches yet. Try a title, creator, or mood like “quiet movies” or “jazz”.
              </p>
            ) : (
              <>
                {catalogSearch.directMatches.length > 0 && (
                  <div>
                    <p className="mb-2 text-[10px] uppercase tracking-[0.14em] text-white/32">
                      Results
                    </p>
                    <ul className="space-y-2">
                      {catalogSearch.directMatches.map((content) => (
                        <li key={content.id}>
                          <SearchResultCard
                            cover={content.cover}
                            title={content.title}
                            creator={content.creator}
                            type={content.type}
                            onClick={() => onSelect(contentToSelection(content))}
                          />
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {catalogSearch.recommendations.length > 0 && (
                  <div>
                    <p className="mb-2 text-[10px] uppercase tracking-[0.14em] text-white/32">
                      You may enjoy
                    </p>
                    <ul className="space-y-2">
                      {catalogSearch.recommendations.map((rec) => (
                        <li key={rec.content.id}>
                          <button
                            type="button"
                            onClick={() => onSelect(contentToSelection(rec.content))}
                            className="flex w-full items-start gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-3 text-left transition-colors hover:bg-white/[0.06]"
                          >
                            <MemoryCover
                              cover={rec.content.cover}
                              title={rec.content.title}
                              className="w-12 shrink-0 rounded-xl"
                            />
                            <div className="min-w-0 flex-1">
                              {rec.anchorTitle && (
                                <p className="text-[10px] text-teal-300/55">
                                  Because you like {rec.anchorTitle}
                                </p>
                              )}
                              <p className="mt-0.5 truncate text-sm font-medium text-white/88">
                                {rec.content.title}
                              </p>
                              <p className="truncate text-xs text-white/45">
                                {rec.content.creator}
                              </p>
                              <p className="mt-1 text-[11px] leading-snug text-white/38">
                                {rec.reason}
                              </p>
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </section>

      <section>
        <p className="text-[10px] uppercase tracking-[0.16em] text-white/35">
          From your list
        </p>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {WAITING_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onWaitingTabChange(tab.id)}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1.5 text-[11px] transition-colors",
                waitingTab === tab.id
                  ? "border-white/18 bg-white/10 text-white/88"
                  : "border-white/10 text-white/45 hover:bg-white/[0.04]",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {waitingItems.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-5 text-sm text-white/42">
            Nothing waiting here yet — search above to discover something new.
          </p>
        ) : (
          <ul className="-mx-1 mt-3 flex gap-2.5 overflow-x-auto px-1 pb-1">
            {waitingItems.map((content) => (
              <li key={content.id} className="w-[148px] shrink-0">
                <button
                  type="button"
                  onClick={() => onSelect(contentToSelection(content))}
                  className="flex w-full flex-col overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.03] text-left transition-colors hover:bg-white/[0.06]"
                >
                  <MemoryCover
                    cover={content.cover}
                    title={content.title}
                    className="aspect-[4/5] w-full rounded-none"
                  />
                  <div className="space-y-0.5 p-2.5">
                    <p className="line-clamp-2 text-xs font-medium text-white/85">
                      {content.title}
                    </p>
                    <p className="text-[10px] uppercase tracking-[0.12em] text-white/32">
                      {CONTENT_TYPE_LABELS[content.type]}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function SearchResultCard({
  cover,
  title,
  creator,
  type,
  onClick,
}: {
  cover: string;
  title: string;
  creator: string;
  type: JournalMediaSelection["type"];
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-2.5 text-left transition-colors hover:bg-white/[0.06]"
    >
      <MemoryCover cover={cover} title={title} className="w-11 shrink-0 rounded-lg" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-white/88">{title}</p>
        <p className="truncate text-xs text-white/45">{creator}</p>
        <p className="mt-0.5 text-[10px] uppercase tracking-[0.12em] text-white/30">
          {CONTENT_TYPE_LABELS[type]}
        </p>
      </div>
    </button>
  );
}
