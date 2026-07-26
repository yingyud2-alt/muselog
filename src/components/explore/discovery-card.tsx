import Link from "next/link";

import { ContentCoverImage } from "@/components/explore/content-cover";
import type {
  CommunityVoice,
  ExploreDiscoveryItem,
} from "@/lib/content/explore-discovery";
import { cn } from "@/lib/utils";

const VOICE_LABELS: Record<CommunityVoice, string> = {
  reader: "Reader",
  creator: "Creator",
  critic: "Critic",
};

type DiscoveryCardProps = {
  item: ExploreDiscoveryItem;
  className?: string;
};

export function DiscoveryCard({ item, className }: DiscoveryCardProps) {
  const href = item.contentId ? `/explore/${item.contentId}` : undefined;

  const body = (
    <>
      <ContentCoverImage
        content={{ title: item.title, cover: item.cover }}
        className="rounded-xl"
      />

      <div className="mt-3 space-y-1.5">
        {item.voice ? (
          <p className="font-label text-[10px] uppercase tracking-[0.14em] text-teal-100/40">
            {VOICE_LABELS[item.voice]}
          </p>
        ) : null}

        <h3 className="font-display line-clamp-2 text-[15px] font-normal leading-snug text-white/90">
          {item.title}
        </h3>

        <p className="font-label truncate text-[11px] text-white/40">
          {item.creator}
        </p>

        <p className="font-display line-clamp-2 text-[12px] leading-relaxed text-white/48">
          {item.reason}
        </p>
      </div>
    </>
  );

  const shellClass = cn(
    "group block w-[168px] shrink-0 rounded-2xl border border-white/[0.08]",
    "bg-white/[0.035] p-3 shadow-[0_10px_28px_rgba(0,0,0,0.16)] backdrop-blur-md",
    "transition hover:-translate-y-0.5 hover:border-white/14 hover:bg-white/[0.05]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-200/20",
    className,
  );

  if (href) {
    return (
      <Link href={href} className={shellClass}>
        {body}
      </Link>
    );
  }

  return <article className={shellClass}>{body}</article>;
}
