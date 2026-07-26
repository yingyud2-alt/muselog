"use client";

import { AiReflectionCard } from "@/components/dashboard/ai-reflection-card";
import { CulturalTimeline } from "@/components/dashboard/cultural-timeline";
import { MuseAiPicks } from "@/components/dashboard/muse-ai-picks";
import { RecentlyAddedPreview } from "@/components/dashboard/recently-added-preview";
import { YourJourneyCard } from "@/components/dashboard/your-journey-card";
import { MediaFloatingDetail } from "@/components/calendar/MediaFloatingDetail";
import { useDesktopDashboard } from "@/hooks/use-desktop-dashboard";
import type { MediaItem } from "@/types/media";
import { useState } from "react";

export function DesktopHomeSections() {
  const data = useDesktopDashboard();
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);

  return (
    <>
      <div className="space-y-10 py-6 pb-10">
        <YourJourneyCard journeyStats={data.journeyStats} />
        <AiReflectionCard
          summary={data.reflectionSummary}
          monthYear={data.reflectionMonthYear}
        />
        <CulturalTimeline
          entries={data.timelineEntries}
          onSelect={setSelectedItem}
        />
        <MuseAiPicks picks={data.picks} likedTitle={data.likedTitle} />
        <RecentlyAddedPreview items={data.recentlyAdded} />
      </div>

      <MediaFloatingDetail
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
      />
    </>
  );
}
