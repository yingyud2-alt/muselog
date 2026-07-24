"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { MoodTagPicker } from "@/components/explore/mood-tag-picker";
import { StarRating } from "@/components/explore/star-rating";
import { Button } from "@/components/ui/button";
import { formatDisplayDate } from "@/lib/display-date";
import { MEMORY_STATUS_OPTIONS } from "@/lib/content/constants";
import { removeMemory, useUserMemory } from "@/lib/content/memory-store";
import type { Content, Memory, MemoryStatus } from "@/lib/content/types";
import { cn } from "@/lib/utils";

type ContentDetailFormProps = {
  content: Content;
};

type ContentDetailFormFieldsProps = {
  content: Content;
  memory: Memory | null;
  save: (
    partial: Partial<Omit<Memory, "contentId" | "id" | "createdAt">> & {
      status: MemoryStatus;
    },
  ) => Memory;
};

function ContentDetailFormFields({
  content,
  memory,
  save,
}: ContentDetailFormFieldsProps) {
  const router = useRouter();
  const [status, setStatus] = useState<MemoryStatus>(memory?.status ?? "WANT");
  const [rating, setRating] = useState(memory?.rating ?? 0);
  const [note, setNote] = useState(memory?.note ?? "");
  const [mood, setMood] = useState<string[]>(memory?.mood ?? []);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    save({
      status,
      rating: rating > 0 ? rating : undefined,
      note: note.trim() || undefined,
      mood: mood.length > 0 ? mood : undefined,
    });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  };

  const handleRemove = () => {
    removeMemory(content.id);
    router.push("/explore");
  };

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-md md:p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="text-lg font-medium text-white/90">Your memory</h2>
        {memory && (
          <span className="text-xs text-white/40">
            Saved {formatDisplayDate(memory.createdAt)}
          </span>
        )}
      </div>

      <div className="space-y-5">
        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.14em] text-white/38">
            Status
          </p>
          <div className="flex flex-wrap gap-2">
            {MEMORY_STATUS_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setStatus(option.value)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs transition-colors",
                  status === option.value
                    ? "border-white/30 bg-white/12 text-white"
                    : "border-white/10 bg-white/[0.03] text-white/55 hover:border-white/20",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.14em] text-white/38">
            Rating
          </p>
          <StarRating value={rating} onChange={setRating} />
        </div>

        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.14em] text-white/38">
            Mood tags
          </p>
          <MoodTagPicker value={mood} onChange={setMood} />
        </div>

        <div>
          <label
            htmlFor="memory-note"
            className="mb-2 block text-xs uppercase tracking-[0.14em] text-white/38"
          >
            My note
          </label>
          <textarea
            id="memory-note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={4}
            placeholder="What stayed with you?"
            className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-white/85 placeholder:text-white/30 outline-none focus:border-white/25 focus:ring-2 focus:ring-white/10"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <Button
            type="button"
            className="bg-white/92 text-black hover:bg-white"
            onClick={handleSave}
          >
            Save to MuseLog
          </Button>
          {memory && (
            <Button
              type="button"
              variant="outline"
              className="border-white/15 bg-transparent text-white/70 hover:bg-white/8"
              onClick={handleRemove}
            >
              Remove
            </Button>
          )}
          {saved && (
            <span className="text-sm text-emerald-300/80">Saved</span>
          )}
        </div>
      </div>
    </section>
  );
}

export function ContentDetailForm({ content }: ContentDetailFormProps) {
  const { memory, save } = useUserMemory(content.id);

  return (
    <ContentDetailFormFields
      key={memory?.updatedAt ?? memory?.createdAt ?? "new"}
      content={content}
      memory={memory}
      save={save}
    />
  );
}
