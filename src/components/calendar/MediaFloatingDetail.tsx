"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Download, X } from "lucide-react";

import { JournalContent } from "@/components/calendar/JournalContent";
import { JourneyHighlightBar } from "@/components/calendar/JourneyHighlightBar";
import { MemoryCover } from "@/components/calendar/memory-cover";
import { MemoryPhotoGallery } from "@/components/calendar/MemoryPhotoGallery";
import { MemoryStars } from "@/components/calendar/memory-stars";
import { TimelineEditor } from "@/components/calendar/TimelineEditor";
import { MEDIA_STATUS_LABELS, MEDIA_TYPE_LABELS } from "@/lib/calendar/constants";
import { downloadMediaCover } from "@/lib/calendar/download-cover";
import {
  formatJourneyDay,
  getJourneyColor,
  getJourneyEnd,
  getJourneyStart,
} from "@/lib/calendar/journey-utils";
import { useMemoryPhotos } from "@/lib/calendar/memory-photos-store";
import { useCalendarMedia } from "@/lib/calendar/use-calendar-media";
import { MOBILE_NAV_CLEARANCE } from "@/lib/mobile/nav-items";
import { navigateToWorkDetail } from "@/lib/navigation/navigate-to-work";
import { workHrefForJournalItem } from "@/lib/work/work-route";
import {
  JOURNEY_COLOR_STYLES,
  type JourneyColor,
  type MediaItem,
} from "@/types/media";
import { cn } from "@/lib/utils";

type MediaFloatingDetailProps = {
  item: MediaItem | null;
  onClose: () => void;
};

export function MediaFloatingDetail({ item, onClose }: MediaFloatingDetailProps) {
  const router = useRouter();
  const closeRef = useRef<HTMLButtonElement>(null);
  const { saveJourney } = useCalendarMedia();
  const { photos, addPhoto } = useMemoryPhotos(item?.id ?? null);
  const [editorOpen, setEditorOpen] = useState(false);

  useEffect(() => {
    if (!item) return;
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
  }, [item, onClose]);

  const workHref = item ? workHrefForJournalItem(item) : null;

  const closePanel = () => {
    setEditorOpen(false);
    onClose();
  };

  const handleSaveJourney = (
    startDate: string,
    endDate: string,
    journeyColor: JourneyColor,
  ) => {
    if (item) saveJourney(item.id, startDate, endDate, journeyColor);
  };

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
            onClick={closePanel}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-md"
          />

          {/* Mobile: single scroll container */}
          <motion.article
            role="dialog"
            aria-modal="true"
            aria-label={`${item.title} journal entry`}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 340 }}
            className={cn(
              "fixed inset-x-0 bottom-0 z-50 flex max-h-[92svh] flex-col md:hidden",
              "rounded-t-[24px] border border-white/12 border-b-0 bg-[#10161D]/96 backdrop-blur-2xl",
            )}
          >
            <div className="sticky top-0 z-20 flex shrink-0 items-center justify-end bg-[#10161D]/96 px-4 pb-2 pt-3">
              <div className="absolute inset-x-0 top-3 flex justify-center">
                <div className="h-1 w-10 rounded-full bg-white/20" aria-hidden="true" />
              </div>
              <button
                ref={closeRef}
                type="button"
                aria-label="Close"
                onClick={closePanel}
                className="relative flex size-8 items-center justify-center rounded-full border border-white/12 bg-black/40 text-white/75"
              >
                <X className="size-3.5" />
              </button>
            </div>

            <div
              className="flex-1 overflow-y-auto overscroll-contain px-5 pt-1"
              style={{ paddingBottom: MOBILE_NAV_CLEARANCE }}
            >
              <button
                type="button"
                onClick={() => downloadMediaCover(item)}
                className="mx-auto block w-full max-w-[160px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
              >
                <MemoryCover
                  cover={item.cover}
                  title={item.title}
                  className="rounded-[16px]"
                  overlay="deep"
                />
              </button>

              <div className="mt-5 space-y-2 text-center">
                <h2 className="font-display text-xl font-bold tracking-tight text-white/95">
                  {item.title}
                </h2>
                <p className="font-label text-sm text-white/48">{item.creator}</p>
                <p className="font-label text-[10px] uppercase tracking-[0.14em] text-white/35">
                  {MEDIA_TYPE_LABELS[item.type]}
                </p>
                {item.rating > 0 && (
                  <div className="flex justify-center">
                    <MemoryStars rating={item.rating} size="md" />
                  </div>
                )}
                <span className="font-label inline-block rounded-full border border-white/12 px-3 py-0.5 text-xs text-white/55">
                  {MEDIA_STATUS_LABELS[item.status]}
                </span>
              </div>

              <div className="mt-6 space-y-2">
                <p className="font-label text-[10px] uppercase tracking-[0.12em] text-white/35">
                  Timeline
                </p>
                <JourneyHighlightBar color={getJourneyColor(item)} className="h-[3px]" />
                <div className="flex items-center justify-center gap-3 text-sm text-white/62">
                  <span>{formatJourneyDay(getJourneyStart(item))}</span>
                  <span className="text-white/25">—</span>
                  <span>{formatJourneyDay(getJourneyEnd(item))}</span>
                </div>
                <p className="font-label flex items-center justify-center gap-2 pt-1 text-[11px] text-white/40">
                  <span
                    className="size-2.5 rounded-full"
                    style={{
                      backgroundColor:
                        JOURNEY_COLOR_STYLES[getJourneyColor(item)].swatch,
                    }}
                    aria-hidden="true"
                  />
                  {JOURNEY_COLOR_STYLES[getJourneyColor(item)].label}
                </p>
              </div>

              <JournalContent
                note={item.note}
                quote={item.quote}
                tags={item.tags ?? []}
                className="mt-5 space-y-4"
              />

              <MemoryPhotoGallery
                item={item}
                photos={photos}
                onAddPhoto={addPhoto}
                className="mt-5"
              />

              <div className="mt-5 space-y-2.5 pb-4">
                <button
                  type="button"
                  onClick={() => downloadMediaCover(item)}
                  className="flex w-full items-center justify-center gap-2 rounded-full border border-white/12 bg-white/[0.03] py-2.5 text-sm text-white/72"
                >
                  <Download className="size-3.5" aria-hidden="true" />
                  Download cover
                </button>
                {workHref && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      navigateToWorkDetail(
                        router,
                        workHref.replace(/^\/work\//, ""),
                        { closeOverlays: false },
                      );
                    }}
                    className="flex w-full items-center justify-center rounded-full border border-white/10 py-2.5 text-sm text-white/55"
                  >
                    View Details →
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setEditorOpen(true)}
                  className="w-full rounded-full border border-white/10 py-2.5 text-sm text-white/45"
                >
                  Edit timeline
                </button>
              </div>
            </div>
          </motion.article>

          {/* Desktop: unchanged centered panel */}
          <div className="pointer-events-none fixed inset-0 z-50 hidden items-center justify-center p-6 md:flex">
            <motion.article
              role="dialog"
              aria-modal="true"
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              className="pointer-events-auto flex w-full max-w-[720px] flex-row rounded-[24px] border border-white/12 bg-[#10161D]/94 shadow-[0_24px_80px_rgba(0,0,0,0.55)] backdrop-blur-2xl"
            >
              <DesktopDetailContent
                item={item}
                photos={photos}
                addPhoto={addPhoto}
                setEditorOpen={setEditorOpen}
                workHref={workHref}
                onClose={closePanel}
                onViewDetails={(href) => {
                  closePanel();
                  navigateToWorkDetail(
                    router,
                    href.replace(/^\/work\//, ""),
                    { closeOverlays: false },
                  );
                }}
                closeRef={closeRef}
              />
            </motion.article>
          </div>

          <AnimatePresence>
            {editorOpen ? (
              <TimelineEditor
                key={`${item.id}-timeline-editor`}
                startDate={getJourneyStart(item)}
                endDate={getJourneyEnd(item)}
                journeyColor={getJourneyColor(item)}
                onSave={handleSaveJourney}
                onClose={() => setEditorOpen(false)}
              />
            ) : null}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  );
}

function DesktopDetailContent({
  item,
  photos,
  addPhoto,
  setEditorOpen,
  workHref,
  onClose,
  onViewDetails,
  closeRef,
}: {
  item: MediaItem;
  photos: string[];
  addPhoto: (url: string) => void;
  setEditorOpen: (v: boolean) => void;
  workHref: string | null;
  onClose: () => void;
  onViewDetails: (href: string) => void;
  closeRef: React.RefObject<HTMLButtonElement | null>;
}) {
  return (
    <>
      <div className="relative w-[220px] shrink-0 border-r border-white/[0.06] p-5">
        <button type="button" onClick={() => downloadMediaCover(item)} className="block w-full">
          <MemoryCover cover={item.cover} title={item.title} className="rounded-[14px]" overlay="deep" />
        </button>
        <button
          ref={closeRef}
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full border border-white/12 bg-black/40 text-white/75"
        >
          <X className="size-3.5" />
        </button>
      </div>
      <div className="min-w-0 flex-1 overflow-y-auto p-5 pr-6">
        <h2 className="font-display text-2xl font-bold text-white/95">{item.title}</h2>
        <p className="font-label mt-1 text-sm text-white/50">{item.creator}</p>
        <p className="font-label mt-1 text-[10px] uppercase tracking-[0.14em] text-white/35">
          {MEDIA_TYPE_LABELS[item.type]}
        </p>
        {item.rating > 0 && <MemoryStars rating={item.rating} size="md" className="mt-2" />}
        <p className="font-label mt-2 inline-flex rounded-full border border-white/12 px-3 py-0.5 text-xs text-white/55">
          {MEDIA_STATUS_LABELS[item.status]}
        </p>
        <div className="mt-4 space-y-2">
          <p className="font-label text-[10px] uppercase tracking-[0.12em] text-white/35">Timeline</p>
          <JourneyHighlightBar color={getJourneyColor(item)} className="h-[3px]" />
          <p className="text-sm text-white/62">
            {formatJourneyDay(getJourneyStart(item))} — {formatJourneyDay(getJourneyEnd(item))}
          </p>
          <p className="font-label flex items-center gap-2 text-[11px] text-white/40">
            <span
              className="size-2.5 rounded-full"
              style={{
                backgroundColor: JOURNEY_COLOR_STYLES[getJourneyColor(item)].swatch,
              }}
              aria-hidden="true"
            />
            Memory color · {JOURNEY_COLOR_STYLES[getJourneyColor(item)].label}
          </p>
        </div>
        <JournalContent note={item.note} quote={item.quote} tags={item.tags ?? []} className="mt-5 space-y-4" />
        <MemoryPhotoGallery item={item} photos={photos} onAddPhoto={addPhoto} className="mt-5" />
        <button
          type="button"
          onClick={() => downloadMediaCover(item)}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-full border border-white/12 py-2.5 text-sm text-white/72"
        >
          <Download className="size-3.5" /> Download cover
        </button>
        {workHref && (
          <button
            type="button"
            onClick={() => onViewDetails(workHref)}
            className="mt-2 flex w-full justify-center rounded-full border border-white/10 py-2.5 text-sm text-white/55"
          >
            View Details →
          </button>
        )}
        <button
          type="button"
          onClick={() => setEditorOpen(true)}
          className="mt-2 w-full rounded-full border border-white/10 py-2.5 text-sm text-white/45"
        >
          Edit timeline
        </button>
      </div>
    </>
  );
}
