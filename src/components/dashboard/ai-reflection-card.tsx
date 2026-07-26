"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";

import {
  DashboardGlassCard,
  DashboardSectionHeader,
} from "@/components/dashboard/dashboard-glass-card";

export type AiReflectionCardProps = {
  summary: string;
  monthYear: string;
};

export function AiReflectionCard({ summary, monthYear }: AiReflectionCardProps) {
  return (
    <section className="space-y-4">
      <DashboardSectionHeader title="AI Reflection" description={monthYear} />

      <DashboardGlassCard className="p-6 md:p-7">
        <div className="flex items-start gap-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04]">
            <Sparkles className="size-4 text-white/55" aria-hidden="true" />
          </div>

          <div className="min-w-0 flex-1 space-y-4">
            <p className="text-sm leading-relaxed text-white/72 md:text-[15px]">
              &ldquo;{summary}&rdquo;
            </p>

            <Link
              href="/reflection"
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm text-white/78 transition hover:border-white/16 hover:bg-white/[0.1] hover:text-white/92"
            >
              View Reflection
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </DashboardGlassCard>
    </section>
  );
}
