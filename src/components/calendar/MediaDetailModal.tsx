"use client";

import { useEffect, useRef, type RefObject } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

import { CalendarMediaIcon } from "@/lib/calendar/media-icon";
import {
  MEDIA_STATUS_LABELS,
  MEDIA_TYPE_LABELS,
} from "@/lib/calendar/constants";
import { formatCardDate } from "@/lib/calendar/utils";
import { MEDIA_EXPLORE_IDS } from "@/types/media";
import type { MediaItem } from "@/types/media";
import { cn } from "@/lib/utils";

import { JournalContent } from "./JournalContent";
import { MemoryCover } from "./memory-cover";
import { MemoryStars } from "./memory-stars";

type MediaDetailModalProps = {
  item: MediaItem | null;
  onClose: () => void;
};

function ModalActions({ item }: { item: MediaItem }) {
  const exploreId = MEDIA_EXPLORE_IDS[item.id];

  return (
    <div className="flex gap-2 pt-2">
      <button
        type="button"
        className="flex-1 rounded-full border border-white/12 bg-white/[0.03] py-2.5 text-sm text-white/70 transition-colors hover:bg-white/8"
      >
        Edit memory
      </button>
      {exploreId ? (
        <Link
          href={`/explore/${exploreId}`}
          className="flex flex-1 items-center justify-center rounded-full bg-white/92 py-2.5 text-sm font-medium text-black transition-colors hover:bg-white"
        >
          View detail
        </Link>
      ) : (
        <button
          type="button"
          disabled
          className="flex-1 rounded-full bg-white/15 py-2.5 text-sm text-white/35"
        >
          View detail
        </button>
      )}
    </div>
  );
}

function DetailHeader({ item }: { item: MediaItem }) {
  return (
    <header className="space-y-3">
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.14em] text-white/42">
        <CalendarMediaIcon type={item.type} className="size-3.5" />
        <span>{MEDIA_TYPE_LABELS[item.type]}</span>
      </div>

      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-white/95 md:text-[1.65rem]">
          {item.title}
        </h2>
        <p className="mt-1 text-sm text-white/50">{item.creator}</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <MemoryStars rating={item.rating} size="md" />
        <span className="rounded-full border border-white/12 px-3 py-0.5 text-xs text-white/55">
          {MEDIA_STATUS_LABELS[item.status]}
        </span>
      </div>

      <p className="text-xs text-white/32">
        {formatCardDate(item.date)}
        {item.moment ? ` · ${item.moment}` : ""}
      </p>
    </header>
  );
}

function DesktopModal({
  item,
  onClose,
  closeRef,
}: {
  item: MediaItem;
  onClose: () => void;
  closeRef: RefObject<HTMLButtonElement | null>;
}) {
  return (
    <motion.article
      role="dialog"
      aria-modal="true"
      aria-label={`${item.title} detail`}
      tabIndex={-1}
      initial={{ opacity: 0, scale: 0.96, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98, y: 8 }}
      transition={{ type: "spring", damping: 28, stiffness: 340, mass: 0.9 }}
      className={cn(
        "pointer-events-auto hidden w-[min(860px,92vw)] max-h-[80vh] overflow-hidden md:flex",
        "rounded-[24px] border border-white/12 bg-[#10161D]/92",
        "shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_24px_80px_rgba(0,0,0,0.55),0_0_60px_rgba(45,212,191,0.06)]",
        "backdrop-blur-2xl",
      )}
    >
      <div className="w-[280px] shrink-0 border-r border-white/[0.06] bg-black/20 p-6">
        <MemoryCover
          cover={item.cover}
          title={item.title}
          className="rounded-[18px] shadow-[0_16px_40px_rgba(0,0,0,0.35)]"
          overlay="deep"
        />
      </div>

      <div className="relative flex min-w-0 flex-1 flex-col">
        <button
          ref={closeRef}
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex size-9 items-center justify-center rounded-full border border-white/12 bg-black/40 text-white/75 backdrop-blur-sm transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/35"
        >
          <X className="size-4" />
        </button>

        <div className="flex-1 space-y-5 overflow-y-auto p-6 pr-8 pt-7">
          <DetailHeader item={item} />
          <JournalContent
            note={item.note}
            quote={item.quote}
            tags={item.tags}
            className="space-y-4"
          />
          <ModalActions item={item} />
        </div>
      </div>
    </motion.article>
  );
}

function MobileSheet({
  item,
  onClose,
  closeRef,
}: {
  item: MediaItem;
  onClose: () => void;
  closeRef: RefObject<HTMLButtonElement | null>;
}) {
  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={`${item.title} detail`}
      tabIndex={-1}
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 32, stiffness: 360, mass: 0.9 }}
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={{ top: 0.05, bottom: 0.35 }}
      onDragEnd={(_, info) => {
        if (info.offset.y > 96 || info.velocity.y > 600) {
          onClose();
        }
      }}
      className={cn(
        "pointer-events-auto fixed inset-x-0 bottom-0 z-50 flex max-h-[85vh] flex-col md:hidden",
        "rounded-t-[24px] border border-white/12 border-b-0 bg-[#10161D]/95",
        "shadow-[0_-12px_60px_rgba(0,0,0,0.45),0_0_40px_rgba(45,212,191,0.05)]",
        "backdrop-blur-2xl",
      )}
    >
      <div className="flex shrink-0 flex-col items-center pt-3">
        <div
          aria-hidden="true"
          className="h-1 w-10 rounded-full bg-white/20"
        />
        <button
          ref={closeRef}
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute right-4 top-4 flex size-8 items-center justify-center rounded-full border border-white/12 bg-black/40 text-white/75"
        >
          <X className="size-3.5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-[calc(env(safe-area-inset-bottom)+20px)] pt-4">
        <div className="mx-auto w-full max-w-[180px]">
          <MemoryCover
            cover={item.cover}
            title={item.title}
            className="rounded-[16px]"
            overlay="deep"
          />
        </div>

        <div className="mt-5 space-y-4">
          <DetailHeader item={item} />
          <JournalContent
            note={item.note}
            quote={item.quote}
            tags={item.tags}
            className="space-y-4"
          />
          <ModalActions item={item} />
        </div>
      </div>
    </motion.div>
  );
}

export function MediaDetailModal({ item, onClose }: MediaDetailModalProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!item) {
      return;
    }

    closeRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [item, onClose]);

  return (
    <AnimatePresence>
      {item && (
        <>
          <motion.button
            type="button"
            aria-label="Close detail"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/45 backdrop-blur-md"
          />

          <div className="pointer-events-none fixed inset-0 z-50 hidden items-center justify-center p-6 md:flex">
            <DesktopModal item={item} onClose={onClose} closeRef={closeRef} />
          </div>

          <MobileSheet item={item} onClose={onClose} closeRef={closeRef} />
        </>
      )}
    </AnimatePresence>
  );
}
