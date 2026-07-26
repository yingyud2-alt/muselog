import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { ContentCoverImage } from "@/components/explore/content-cover";
import { ContentDetailForm } from "@/components/explore/content-detail-form";
import { MediaIcon } from "@/components/dashboard/mood-bubble-shared";
import {
  CONTENT_TYPE_LABELS,
  CREATOR_LABELS,
} from "@/lib/content/constants";
import { getContentById } from "@/lib/content/content-data";

type ExploreDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ExploreDetailPage({
  params,
}: ExploreDetailPageProps) {
  const { id } = await params;
  const content = getContentById(id);

  if (!content) {
    notFound();
  }

  return (
    <main className="min-h-[100svh] overflow-x-hidden bg-[#0D1117] pb-[calc(env(safe-area-inset-bottom)+88px)] text-white md:min-h-screen md:pb-[calc(env(safe-area-inset-bottom)+32px)]">
      <div className="mx-auto max-w-5xl px-6 py-8 md:px-8 md:py-10">
        <Link
          href="/explore"
          className="mb-8 inline-flex items-center gap-2 text-sm text-white/50 transition-colors hover:text-white/80"
        >
          <ArrowLeft className="size-4" />
          Back to Explore
        </Link>

        <div className="grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10">
          <div className="mx-auto w-full max-w-[220px] lg:mx-0">
            <ContentCoverImage content={content} variant="detail" />
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-white/45">
                <MediaIcon
                  type={content.type}
                  className="size-3.5"
                  style={{ opacity: 0.7 }}
                />
                <span>{CONTENT_TYPE_LABELS[content.type]}</span>
              </div>
              <h1 className="text-3xl font-semibold tracking-tight text-white/95 md:text-4xl">
                {content.title}
              </h1>
              <p className="text-base text-white/55">
                {CREATOR_LABELS[content.type]}: {content.creator}
              </p>
              <p className="max-w-2xl text-[15px] leading-relaxed text-white/68">
                {content.description}
              </p>
              {content.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {content.tags.map((tag) => (
                    <span key={tag} className="text-sm text-white/38">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <ContentDetailForm content={content} />
          </div>
        </div>
      </div>
    </main>
  );
}
