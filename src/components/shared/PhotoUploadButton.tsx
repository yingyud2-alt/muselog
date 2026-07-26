"use client";

import { useRef } from "react";
import { ImagePlus } from "lucide-react";

import { readFileAsDataUrl } from "@/lib/calendar/memory-photos-store";
import { cn } from "@/lib/utils";

type PhotoUploadButtonProps = {
  label?: string;
  onPhotoSelected: (dataUrl: string) => void;
  className?: string;
  variant?: "button" | "tile";
};

export function PhotoUploadButton({
  label = "Add photo",
  onPhotoSelected,
  className,
  variant = "button",
}: PhotoUploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const dataUrl = await readFileAsDataUrl(file);
    onPhotoSelected(dataUrl);
    event.target.value = "";
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={handleChange}
      />

      {variant === "tile" ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={cn(
            "flex aspect-square flex-col items-center justify-center gap-1 rounded-xl",
            "border border-dashed border-white/12 bg-white/[0.02] text-white/38",
            "transition-colors hover:border-white/20 hover:text-white/55",
            className,
          )}
        >
          <ImagePlus className="size-4" aria-hidden="true" />
          <span className="text-[10px]">{label}</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={cn(
            "w-full rounded-full border border-white/12 bg-white/[0.03] py-2.5 text-sm text-white/72",
            "transition-colors hover:bg-white/8",
            className,
          )}
        >
          {label}
        </button>
      )}
    </>
  );
}
