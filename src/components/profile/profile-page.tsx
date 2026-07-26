"use client";

import { useState } from "react";

import { MediaFloatingDetail } from "@/components/calendar/MediaFloatingDetail";
import { LibraryDetail } from "@/components/library/library-detail";
import { ProfileCurrentJourney } from "@/components/profile/profile-current-journey";
import { ProfileFavorites } from "@/components/profile/profile-favorites";
import { ProfileHeader } from "@/components/profile/profile-header";
import { ProfileReflection } from "@/components/profile/profile-reflection";
import { ProfileStatsSection } from "@/components/profile/profile-stats";
import { ProfileTasteTags } from "@/components/profile/profile-taste-tags";
import { ProfileTimeline } from "@/components/profile/profile-timeline";
import { useProfileData } from "@/lib/profile/use-profile-data";
import { useReflectionPreview } from "@/lib/reflection/use-reflection-data";
import type { LibraryItem } from "@/lib/library/library-types";
import { MOBILE_NAV_CLEARANCE } from "@/lib/mobile/nav-items";
import type { MediaItem } from "@/types/media";

export function ProfilePage() {
  const {
    stats,
    identity,
    currentJourney,
    reflection,
    tasteTags,
    favorites,
    timeline,
  } = useProfileData();
  const preview = useReflectionPreview();

  const [selectedLibraryItem, setSelectedLibraryItem] =
    useState<LibraryItem | null>(null);
  const [selectedJournalItem, setSelectedJournalItem] =
    useState<MediaItem | null>(null);

  return (
    <>
      <div
        className="mx-auto max-w-[1200px] px-5 pt-[calc(env(safe-area-inset-top)+20px)] md:px-8 md:py-10"
        style={{ paddingBottom: MOBILE_NAV_CLEARANCE }}
      >
        <div className="space-y-8 md:space-y-10">
          <ProfileHeader identity={identity} />

          <ProfileStatsSection stats={stats} />

          <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
            <ProfileCurrentJourney
              journey={currentJourney}
              onSelect={(item) => setSelectedLibraryItem(item)}
            />
            <ProfileReflection
              reflection={reflection}
              previewSummary={preview.summary}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
            <ProfileTasteTags tags={tasteTags} />
            <ProfileFavorites
              favorites={favorites}
              onSelect={setSelectedLibraryItem}
            />
          </div>

          <ProfileTimeline
            timeline={timeline}
            onSelect={setSelectedJournalItem}
          />
        </div>
      </div>

      <LibraryDetail
        item={selectedLibraryItem}
        onClose={() => setSelectedLibraryItem(null)}
      />
      <MediaFloatingDetail
        item={selectedJournalItem}
        onClose={() => setSelectedJournalItem(null)}
      />
    </>
  );
}
