"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

import { JournalSearchBar } from "@/components/calendar/journal-search-bar";
import { JournalWaitingList } from "@/components/calendar/journal-waiting-list";
import { ManualJournalForm } from "@/components/calendar/manual-journal-form";
import { formatCardDate } from "@/lib/calendar/utils";
import {
  contentToJournalItem,
  getDefaultWaitingTab,
  getWaitingList,
  searchWaitingContent,
  type WaitingTab,
} from "@/lib/calendar/journal-waiting-list";
import type { Content } from "@/lib/content/types";
import type { MediaItem } from "@/types/media";
import { cn } from "@/lib/utils";

type AddToJournalSheetProps = {
  date: string | null;
  journalItems: MediaItem[];
  onClose: () => void;
  onAdd: (item: MediaItem) => void;
};

export function AddToJournalSheet({
  date,
  journalItems,
  onClose,
  onAdd,
}: AddToJournalSheetProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!date) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [date, onClose]);

  return (
    <AnimatePresence>
      {date && (
        <>
          <motion.button
            type="button"
            aria-label="Close"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[55] bg-black/45 backdrop-blur-md md:hidden"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Add to Journal"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 360 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.05, bottom: 0.35 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 96 || info.velocity.y > 600) onClose();
            }}
            className={cn(
              "fixed inset-x-0 bottom-0 z-[55] flex max-h-[88svh] flex-col md:hidden",
              "rounded-t-[24px] border border-white/12 border-b-0 bg-[#10161D]/96",
              "shadow-[0_-12px_60px_rgba(0,0,0,0.45)] backdrop-blur-2xl",
            )}
          >
            <div className="relative shrink-0 pt-3">
              <div className="mx-auto h-1 w-10 rounded-full bg-white/20" aria-hidden="true" />
              <button
                ref={closeRef}
                type="button"
                aria-label="Close"
                onClick={onClose}
                className="absolute right-4 top-3 flex size-8 items-center justify-center rounded-full border border-white/12 bg-black/40 text-white/75"
              >
                <X className="size-3.5" />
              </button>
            </div>

            <AddToJournalSheetBody
              key={date}
              date={date}
              journalItems={journalItems}
              onClose={onClose}
              onAdd={onAdd}
            />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function AddToJournalSheetBody({
  date,
  journalItems,
  onClose,
  onAdd,
}: {
  date: string;
  journalItems: MediaItem[];
  onClose: () => void;
  onAdd: (item: MediaItem) => void;
}) {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<WaitingTab>(() => getDefaultWaitingTab(journalItems));
  const [manualOpen, setManualOpen] = useState(false);

  const searchResults = useMemo(
    () => searchWaitingContent(journalItems, query),
    [journalItems, query],
  );

  const tabItems = useMemo(
    () => getWaitingList(journalItems, tab),
    [journalItems, tab],
  );

  const displayItems = useMemo(() => {
    if (!query.trim()) return tabItems;
    const filtered = searchResults.filter((item) => {
      const map: Record<WaitingTab, Content["type"]> = {
        read: "BOOK",
        watch: "MOVIE",
        listen: "MUSIC",
      };
      return item.type === map[tab];
    });
    return filtered.length > 0 ? filtered : searchResults;
  }, [query, tabItems, searchResults, tab]);

  const showGrouped = query.trim().length > 0 && searchResults.length > 0;

  const handleAdd = (content: Content) => {
    onAdd(contentToJournalItem(content, date));
    onClose();
  };

  const TABS: { id: WaitingTab; label: string }[] = [
    { id: "read", label: "To Read" },
    { id: "watch", label: "To Watch" },
    { id: "listen", label: "To Listen" },
  ];

  return (
    <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-[calc(env(safe-area-inset-bottom)+88px)] pt-3">
      <p className="text-xs text-white/40">{formatCardDate(date)}</p>
      <h2 className="mt-1 text-lg font-medium text-white/90">Add to Journal</h2>

      {manualOpen ? (
        <div className="mt-5">
          <ManualJournalForm
            startDate={date}
            onSave={(item) => {
              onAdd(item);
              onClose();
            }}
            onCancel={() => setManualOpen(false)}
          />
        </div>
      ) : (
        <>
          <JournalSearchBar value={query} onChange={setQuery} className="mt-4" />

          {!query.trim() && (
            <div className="mt-4 flex gap-2">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={cn(
                    "flex-1 rounded-full border py-2 text-[11px]",
                    tab === t.id
                      ? "border-white/20 bg-white/10 text-white"
                      : "border-white/10 text-white/45",
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}

          <div className="mt-4">
            {showGrouped ? (
              (["BOOK", "MOVIE", "MUSIC"] as const).map((type) => {
                const group = searchResults.filter((i) => i.type === type);
                if (group.length === 0) return null;
                const label =
                  type === "BOOK" ? "Books" : type === "MOVIE" ? "Movies" : "Music";
                return (
                  <div key={type} className="mb-4">
                    <p className="mb-2 text-[10px] uppercase tracking-wider text-white/35">
                      {label}
                    </p>
                    <JournalWaitingList items={group} onAdd={handleAdd} />
                  </div>
                );
              })
            ) : (
              <JournalWaitingList
                items={displayItems}
                onAdd={handleAdd}
                onAddManually={() => setManualOpen(true)}
              />
            )}
          </div>

          <button
            type="button"
            onClick={() => setManualOpen(true)}
            className="mt-6 w-full rounded-full border border-white/10 py-2.5 text-sm text-white/55"
          >
            Add manually
          </button>
        </>
      )}
    </div>
  );
}
