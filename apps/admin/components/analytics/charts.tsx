"use client";

export function SectionCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="mb-4">
        <h2 className="font-semibold text-foreground">{title}</h2>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

export function BarList({
  rows,
  emptyText = "No data yet.",
}: {
  rows: Array<{ label: string; value: number }>;
  emptyText?: string;
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground py-6 text-center">{emptyText}</p>;
  }
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <div className="space-y-2.5">
      {rows.map((row) => (
        <div key={row.label} className="flex items-center gap-3">
          <span className="text-sm text-foreground truncate flex-1 min-w-0" title={row.label}>
            {row.label}
          </span>
          <div className="w-32 h-2 bg-muted/30 rounded-full overflow-hidden flex-shrink-0">
            <div
              className="h-full bg-primary/70 rounded-full"
              style={{ width: `${(row.value / max) * 100}%` }}
            />
          </div>
          <span className="text-sm font-semibold text-foreground w-8 text-right flex-shrink-0">
            {row.value}
          </span>
        </div>
      ))}
    </div>
  );
}
