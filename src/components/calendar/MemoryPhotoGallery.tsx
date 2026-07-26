"use client";

import { MemoryCover } from "@/components/calendar/memory-cover";
import { PhotoUploadButton } from "@/components/shared/PhotoUploadButton";
import type { MediaItem } from "@/types/media";
import { cn } from "@/lib/utils";

type MemoryPhotoGalleryProps = {
  item: MediaItem;
  photos: string[];
  onAddPhoto: (photoUrl: string) => void;
  className?: string;
};

export function MemoryPhotoGallery({
  item,
  photos,
  onAddPhoto,
  className,
}: MemoryPhotoGalleryProps) {
  const hasCover = Boolean(item.cover);

  return (
    <div className={className}>
      <p className="text-[10px] uppercase tracking-[0.12em] text-white/35">
        Memory photos
      </p>

      <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
        {hasCover && (
          <div className="overflow-hidden rounded-xl ring-1 ring-white/10">
            <MemoryCover
              cover={item.cover}
              title={item.title}
              className="aspect-square rounded-xl"
              overlay="soft"
            />
          </div>
        )}

        {photos.map((photo, index) => (
          <div
            key={`${photo.slice(0, 32)}-${index}`}
            className="overflow-hidden rounded-xl ring-1 ring-white/10"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo}
              alt={`${item.title} memory ${index + 1}`}
              className="aspect-square size-full object-cover"
            />
          </div>
        ))}

        <PhotoUploadButton
          variant="tile"
          label="Add"
          onPhotoSelected={onAddPhoto}
          className={cn(hasCover || photos.length > 0 ? "" : "col-span-2 row-span-2")}
        />
      </div>
    </div>
  );
}
