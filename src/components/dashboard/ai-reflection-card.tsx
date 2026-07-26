"use client";

import { AiReflectionCard as SharedAiReflectionCard } from "@/components/ai/ai-reflection-card";
import {
  DashboardSectionHeader,
} from "@/components/dashboard/dashboard-glass-card";
import type {
  AiReflectionActivity,
  AiReflectionJournalEntry,
  AiReflectionUserMedia,
} from "@/lib/ai/ai-reflection-types";

export type AiReflectionCardProps = {
  userMedia: AiReflectionUserMedia[];
  journalEntries: AiReflectionJournalEntry[];
  recentActivities: AiReflectionActivity[];
  monthYear?: string;
};

/** Home entrance — compact Muse AI insight above the fold sections */
export function AiReflectionCard({
  userMedia,
  journalEntries,
  recentActivities,
  monthYear,
}: AiReflectionCardProps) {
  return (
    <section className="space-y-4">
      <DashboardSectionHeader
        title="Muse AI"
        description={monthYear ?? "A quiet insight from your journey"}
      />
      <SharedAiReflectionCard
        variant="compact"
        userMedia={userMedia}
        journalEntries={journalEntries}
        recentActivities={recentActivities}
        ctaHref="/profile"
        ctaLabel="Your Muse"
      />
    </section>
  );
}
