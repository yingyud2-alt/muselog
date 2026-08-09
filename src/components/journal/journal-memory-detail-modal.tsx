"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, X } from "lucide-react";

import { MemoryCover } from "@/components/calendar/memory-cover";
import { openJournalEntryWorkDetail } from "@/lib/calendar/open-journal-work-detail";
import { MEDIA_STATUS_LABELS, MEDIA_TYPE_LABELS } from "@/lib/calendar/constants";
import {
  formatJourneyRange,
  getJourneyEnd,
  getJourneyStart,
} from "@/lib/calendar/journey-utils";
import { useMemoryPhotos } from "@/lib/calendar/memory-photos-store";
import {
  resolveJournalDisplayCover,
  resolveJournalWorkId,
} from "@/lib/calendar/resolve-journal-work-cover";
import { useCalendarMedia } from "@/lib/calendar/use-calendar-media";
import { mediaTypeToContentType } from "@/lib/content/bubble-content-bridge";
import { openJournalQuickLog } from "@/lib/detail/detail-overlay-store";
import { MOBILE_NAV_CLEARANCE } from "@/lib/mobile/nav-items";
import { DARK_FLOATING_PANEL_CLASS } from "@/lib/ui/dark-panel";
import { isRemoteCoverUrl } from "@/lib/work/cover-url";
import {
  resolveCanonicalWork,
  toCanonicalWorkLog,
} from "@/lib/work/resolve-canonical-work";
import { cn } from "@/lib/utils";
import type { MediaItem } from "@/types/media";

type JournalMemoryDetailModalProps = {
  entryId: string;
  onClose: () => void;
  lockScroll?: boolean;
  zIndex?: number;
};

function activityStatusLabel(item: MediaItem): string {
  const moment = item.moment?.trim();
  if (moment) return moment;
  return MEDIA_STATUS_LABELS[item.status] ?? item.status;
}

/**
 * Journal image priority:
 * 1) journal photo
 * 2) canonicalWork.coverUrl → library → journal snapshot → catalog
 */
function resolveJournalDisplayImage(
  item: MediaItem,
  journalPhotos: string[],
): string {
  const journalPhoto =
    journalPhotos.find((url) => url.trim()) ||
    item.memories?.find((url) => url.trim());

  if (journalPhoto?.trim()) {
    return journalPhoto.trim();
  }

  return resolveJournalDisplayCover(item);
}

function MemoryActions({
  onEdit,
  onViewWork,
  className,
}: {
  onEdit: () => void;
  onViewWork: () => void;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <button
        type="button"
        onClick={onEdit}
        className={cn(
          "flex w-full items-center justify-center rounded-full",
          "bg-white/[0.12] py-2.5 text-sm font-medium text-white",
          "transition-colors hover:bg-white/[0.16]",
        )}
      >
        Edit Memory
      </button>
      <button
        type="button"
        onClick={onViewWork}
        className={cn(
          "flex w-full items-center justify-center gap-1.5 rounded-full",
          "border border-white/12 bg-transparent py-2.5 text-sm text-white/62",
          "transition-colors hover:border-white/20 hover:text-white/85",
        )}
      >
        View Work Detail
        <ArrowRight className="size-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}

/**
 * Journal Memory Detail — horizontal desktop panel, sticky actions.
 * Separate from WorkDetailModal.
 */
export function JournalMemoryDetailModal({
  entryId,
  onClose,
  lockScroll = false,
  zIndex = 70,
}: JournalMemoryDetailModalProps) {
  const open = Boolean(entryId);
  const { items } = useCalendarMedia();
  const item = items.find((entry) => entry.id === entryId) ?? null;
  const { photos } = useMemoryPhotos(item?.id ?? null);

  const workId = item ? resolveJournalWorkId(item) : "";
  const work = item
    ? resolveCanonicalWork({
        workId,
        title: item.title,
        creator: item.creator,
        type: item.type,
      })
    : null;

  const displayImage = item
    ? resolveJournalDisplayImage(item, photos)
    : "";
  const reflection = item?.note?.trim() || item?.quote?.trim() || "";
  const moodTags = (item?.tags ?? []).filter(Boolean).slice(0, 8);
  const dateRange = item ? formatJourneyRange(item) : "";
  const hasJournalPhoto = Boolean(
    photos[0]?.trim() || item?.memories?.some((url) => url.trim()),
  );

  useEffect(() => {
    if (!open || !item) return;
    // eslint-disable-next-line no-console
    console.info(
      "[canonical-work:journal-memory-detail]",
      toCanonicalWorkLog("journal-memory-detail", workId, {
        workId,
        title: item.title,
        creator: item.creator,
        type: item.type,
      }),
    );
  }, [open, item, workId]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKeyDown);
    if (lockScroll) {
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      if (lockScroll) {
        document.body.style.overflow = "";
      }
    };
  }, [open, onClose, lockScroll]);

  const handleEditMemory = () => {
    if (!item) return;
    openJournalQuickLog(work?.id || workId || resolveJournalWorkId(item), {
      entryId: item.id,
      initialDate: getJourneyStart(item) || item.date || undefined,
      snapshot: {
        title: item.title,
        creator: item.creator,
        type: mediaTypeToContentType(item.type),
        cover: displayImage,
        tags: item.tags,
      },
    });
  };

  const handleViewWorkDetail = () => {
    if (!item) return;
    openJournalEntryWorkDetail(item);
  };

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            aria-label="Close detail"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-md"
            style={{ zIndex }}
          />

          {/* Mobile — stacked sheet with sticky actions */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={item ? `${item.title} memory` : "Journal memory"}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className={cn(
              "fixed inset-x-0 bottom-0 flex max-h-[90svh] flex-col overflow-hidden text-white md:hidden",
              DARK_FLOATING_PANEL_CLASS,
              "rounded-t-[24px] bg-[rgba(15,20,28,0.92)] backdrop-blur-xl",
            )}
            style={{ zIndex: zIndex + 1 }}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="absolute right-4 top-4 z-10 flex size-9 items-center justify-center rounded-full text-white/60 transition-colors hover:text-white"
            >
              <X size={18} />
            </button>

            {!item ? (
              <div className="px-5 py-12 text-center">
                <p className="text-sm text-white/50">
                  This memory could not be found.
                </p>
              </div>
            ) : (
              <>
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-3 pt-5">
                  <div className="mx-auto w-[148px]">
                    <MemoryCover
                      cover={displayImage}
                      title={item.title}
                      overlay={isRemoteCoverUrl(displayImage) ? "soft" : "deep"}
                      className="rounded-[16px] shadow-[0_16px_40px_rgba(0,0,0,0.45)]"
                    />
                  </div>
                  <MemoryContent
                    item={item}
                    dateRange={dateRange}
                    moodTags={moodTags}
                    reflection={reflection}
                    hasJournalPhoto={hasJournalPhoto}
                    photos={photos}
                    align="center"
                    className="mt-5"
                  />
                </div>
                <div
                  className="shrink-0 border-t border-white/[0.08] bg-[rgba(15,20,28,0.96)] px-5 pt-3"
                  style={{ paddingBottom: MOBILE_NAV_CLEARANCE }}
                >
                  <MemoryActions
                    onEdit={handleEditMemory}
                    onViewWork={handleViewWorkDetail}
                  />
                </div>
              </>
            )}
          </motion.div>

          {/* Desktop — horizontal detail panel */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={item ? `${item.title} memory` : "Journal memory"}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className={cn(
              "fixed left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2",
              "w-[90vw] max-w-[760px] max-h-[85vh]",
              "overflow-hidden rounded-[22px] text-white md:flex md:flex-col",
              DARK_FLOATING_PANEL_CLASS,
              "bg-[rgba(15,20,28,0.92)] backdrop-blur-xl",
            )}
            style={{ zIndex: zIndex + 1 }}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="absolute right-4 top-4 z-20 flex size-9 items-center justify-center rounded-full text-white/55 transition-colors hover:text-white"
            >
              <X size={18} />
            </button>

            {!item ? (
              <div className="flex flex-1 items-center justify-center px-8 py-16">
                <p className="text-sm text-white/50">
                  This memory could not be found.
                </p>
              </div>
            ) : (
              <>
                <div className="grid min-h-0 flex-1 grid-cols-[220px_1fr] gap-0 overflow-hidden">
                  {/* Left — large cover */}
                  <div className="flex min-h-0 flex-col items-center justify-center border-r border-white/[0.06] bg-white/[0.02] px-5 py-7">
                    <div className="w-full max-w-[188px]">
                      <MemoryCover
                        cover={displayImage}
                        title={item.title}
                        overlay={
                          isRemoteCoverUrl(displayImage) ? "soft" : "deep"
                        }
                        className="rounded-[18px] shadow-[0_20px_48px_rgba(0,0,0,0.5)] ring-1 ring-white/14"
                      />
                    </div>
                    {hasJournalPhoto ? (
                      <p className="mt-3 font-label text-[10px] uppercase tracking-[0.14em] text-white/30">
                        Journal photo
                      </p>
                    ) : null}
                  </div>

                  {/* Right — content + sticky actions */}
                  <div className="flex min-h-0 min-w-0 flex-col">
                    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pb-4 pt-7 pr-12">
                      <MemoryContent
                        item={item}
                        dateRange={dateRange}
                        moodTags={moodTags}
                        reflection={reflection}
                        hasJournalPhoto={hasJournalPhoto}
                        photos={photos}
                        align="left"
                      />
                    </div>

                    <div className="shrink-0 border-t border-white/[0.08] bg-[rgba(15,20,28,0.96)] px-6 py-4">
                      <MemoryActions
                        onEdit={handleEditMemory}
                        onViewWork={handleViewWorkDetail}
                      />
                    </div>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}

function MemoryContent({
  item,
  dateRange,
  moodTags,
  reflection,
  hasJournalPhoto,
  photos,
  align,
  className,
}: {
  item: MediaItem;
  dateRange: string;
  moodTags: string[];
  reflection: string;
  hasJournalPhoto: boolean;
  photos: string[];
  align: "left" | "center";
  className?: string;
}) {
  const centered = align === "center";

  return (
    <div className={cn(centered && "text-center", className)}>
      <p className="font-label text-[10px] uppercase tracking-[0.16em] text-white/35">
        Journal Memory
      </p>
      <h2
        className={cn(
          "mt-2 font-display font-semibold leading-tight tracking-tight text-white/95",
          centered ? "text-[1.35rem]" : "text-[1.5rem]",
        )}
      >
        {item.title}
      </h2>
      <p className="mt-1.5 text-sm text-white/48">{item.creator}</p>
      <p className="mt-1.5 font-label text-[10px] uppercase tracking-[0.14em] text-white/32">
        {MEDIA_TYPE_LABELS[item.type]}
      </p>

      <div
        className={cn(
          "mt-5 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3",
          centered ? "text-left" : "",
        )}
      >
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="font-label text-[10px] uppercase tracking-[0.14em] text-white/35">
              Date range
            </p>
            <p className="mt-1 text-sm leading-snug text-white/78">{dateRange}</p>
          </div>
          <div>
            <p className="font-label text-[10px] uppercase tracking-[0.14em] text-white/35">
              Activity
            </p>
            <p className="mt-1 inline-flex rounded-full border border-white/12 bg-white/[0.04] px-2.5 py-0.5 text-xs text-white/70">
              {activityStatusLabel(item)}
            </p>
          </div>
        </div>
        {getJourneyStart(item) !== getJourneyEnd(item) ? (
          <p className="mt-2 text-[11px] text-white/35">
            {getJourneyStart(item)} → {getJourneyEnd(item)}
          </p>
        ) : null}
      </div>

      {moodTags.length > 0 ? (
        <div className="mt-4">
          <p className="font-label text-[10px] uppercase tracking-[0.14em] text-white/35">
            Mood
          </p>
          <div
            className={cn(
              "mt-2 flex flex-wrap gap-1.5",
              centered && "justify-center",
            )}
          >
            {moodTags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] text-white/60"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-4">
        <p className="font-label text-[10px] uppercase tracking-[0.14em] text-white/35">
          Reflection
        </p>
        {reflection ? (
          <div
            className={cn(
              "mt-2 space-y-2 text-[13px] leading-relaxed text-white/72",
              centered && "text-left",
            )}
          >
            {item.note?.trim() ? (
              <p className="line-clamp-4">{item.note.trim()}</p>
            ) : null}
            {item.quote?.trim() ? (
              <p className="line-clamp-3 italic text-white/55">
                “{item.quote.trim()}”
              </p>
            ) : null}
          </div>
        ) : (
          <p className="mt-2 text-sm text-white/35">No reflection yet.</p>
        )}
      </div>

      {hasJournalPhoto && photos.length > 1 ? (
        <div className="mt-4">
          <p className="font-label text-[10px] uppercase tracking-[0.14em] text-white/35">
            Journal photos
          </p>
          <div
            className={cn(
              "mt-2 flex gap-2 overflow-x-auto pb-1",
              centered && "justify-center",
            )}
          >
            {photos.slice(0, 5).map((photo) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={photo}
                src={photo}
                alt=""
                className="h-14 w-14 shrink-0 rounded-lg object-cover ring-1 ring-white/10"
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
