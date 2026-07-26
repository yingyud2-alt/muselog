type SectionHeaderProps = {
  title: string;
  description: string;
};

export function SectionHeader({ title, description }: SectionHeaderProps) {
  return (
    <div className="space-y-1">
      <h2 className="font-display text-lg font-bold tracking-tight">{title}</h2>
      <p className="font-display text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
