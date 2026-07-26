"use client";

import { useState } from "react";

import { MediaFloatingDetail } from "@/components/calendar/MediaFloatingDetail";
import { AiReflectionCard } from "@/components/dashboard/ai-reflection-card";
import { CulturalTimeline } from "@/components/dashboard/cultural-timeline";
import { MuseAiPicks } from "@/components/dashboard/muse-ai-picks";
import { RecentlyAddedPreview } from "@/components/dashboard/recently-added-preview";
import { YourJourneyCard } from "@/components/dashboard/your-journey-card";
import { QuickCheckIn } from "@/components/journal/quick-check-in";
import { useDesktopDashboard } from "@/hooks/use-desktop-dashboard";
import { useMuseRecommendations } from "@/lib/ai/use-muse-recommendations";
import type { MediaItem } from "@/types/media";

export function DesktopHomeSections() {
  const data = useDesktopDashboard();
  const recommendations = useMuseRecommendations(5);
  const batchRecommendations = useMuseRecommendations(10);
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [checkInOpen, setCheckInOpen] = useState(false);

  return (
    <>
      <div className="space-y-10 py-6 pb-10">
        <YourJourneyCard
          journeyStats={data.journeyStats}
          onLogToday={() => setCheckInOpen(true)}
        />
        <AiReflectionCard
          userMedia={data.aiReflectionInput.userMedia}
          journalEntries={data.aiReflectionInput.journalEntries}
          recentActivities={data.aiReflectionInput.recentActivities}
          monthYear={data.reflectionMonthYear}
        />
        <MuseAiPicks
          recommendations={recommendations}
          batchRecommendations={batchRecommendations}
        />
        <CulturalTimeline
          entries={data.timelineEntries}
          onSelect={setSelectedItem}
        />
        <RecentlyAddedPreview items={data.recentlyAdded} />
      </div>

      <MediaFloatingDetail
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
      />

      <QuickCheckIn
        variant="modal"
        open={checkInOpen}
        onClose={() => setCheckInOpen(false)}
      />
    </>
  );
}
