import Link from "next/link";
import { Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

type ReflectionEntryLinkProps = {
  className?: string;
};

export function ReflectionEntryLink({ className }: ReflectionEntryLinkProps) {
  return (
    <Link
      href="/reflection"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04]",
        "px-3 py-2 text-xs text-white/65 transition-colors hover:bg-white/[0.07] md:text-sm",
        className,
      )}
    >
      <Sparkles className="size-3.5 text-teal-300/70" aria-hidden="true" />
      AI Reflection
    </Link>
  );
}
