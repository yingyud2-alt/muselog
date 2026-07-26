type JournalContentProps = {
  note: string;
  quote: string;
  tags: string[];
  className?: string;
};

export function JournalContent({
  note,
  quote,
  tags,
  className,
}: JournalContentProps) {
  return (
    <div className={className}>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag}
              className="font-label rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-0.5 text-[11px] lowercase text-white/42"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {note && (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
          <p className="font-label text-[10px] uppercase tracking-[0.12em] text-white/35">
            My thoughts
          </p>
          <p className="font-body mt-2 text-sm leading-relaxed text-white/68">
            {note}
          </p>
        </div>
      )}

      {quote && (
        <p className="font-quote text-sm italic leading-relaxed text-white/45">
          &ldquo;{quote}&rdquo;
        </p>
      )}
    </div>
  );
}
