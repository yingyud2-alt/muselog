"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";

import { MediaFloatingDetail } from "@/components/calendar/MediaFloatingDetail";
import { ReflectionExploration } from "@/components/reflection/reflection-exploration";
import { ReflectionHeader } from "@/components/reflection/reflection-header";
import { ReflectionInsight } from "@/components/reflection/reflection-insight";
import { ReflectionJourney } from "@/components/reflection/reflection-journey";
import { ReflectionMood } from "@/components/reflection/reflection-mood";
import { ReflectionOverview } from "@/components/reflection/reflection-overview";
import { ReflectionTaste } from "@/components/reflection/reflection-taste";
import { useReflectionData } from "@/lib/reflection/use-reflection-data";
import { MOBILE_NAV_CLEARANCE } from "@/lib/mobile/nav-items";
import type { MediaItem } from "@/types/media";

export function ReflectionPage() {
  const data = useReflectionData();
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);

  return (
    <>
      <div
        className="mx-auto max-w-[1200px] px-5 pt-[calc(env(safe-area-inset-top)+20px)] md:px-8 md:py-10"
        style={{ paddingBottom: MOBILE_NAV_CLEARANCE }}
      >
        <Link
          href="/profile"
          className="mb-5 inline-flex items-center gap-1.5 text-xs text-white/40 hover:text-white/60"
        >
          <ArrowLeft className="size-3.5" />
          Profile
        </Link>

        <div className="space-y-6 md:space-y-8">
          <ReflectionHeader monthYear={data.monthYear} />
          <ReflectionOverview stats={data.mediaStats} />
          <ReflectionJourney
            journey={data.journey}
            onSelect={setSelectedItem}
          />

          <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
            <ReflectionTaste tags={data.tasteTags} />
            <ReflectionMood tags={data.moodTags} />
          </div>

          <ReflectionInsight reflection={data.reflection} />
          <ReflectionExploration reflection={data.reflection} />
        </div>
      </div>

      <MediaFloatingDetail
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
      />
    </>
  );
}
