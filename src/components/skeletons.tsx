function Pulse({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-lg bg-[var(--color-surface)] ${className}`} />
  );
}

export function RecommendationSkeleton() {
  return (
    <div className="bg-[var(--color-card)] rounded-2xl shadow-lg p-6 border border-[var(--color-card-border)]">
      <Pulse className="h-5 w-32 mb-2" />
      <Pulse className="h-4 w-24 mb-6" />
      <div className="flex justify-center gap-3 mb-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Pulse key={i} className="w-16 h-16 !rounded-full" />
        ))}
      </div>
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Pulse key={i} className="h-4 w-full" />
        ))}
      </div>
    </div>
  );
}

export function StatsSkeleton() {
  return (
    <div className="bg-[var(--color-card)] rounded-2xl shadow-lg p-6 border border-[var(--color-card-border)]">
      <Pulse className="h-5 w-24 mb-4" />
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Pulse key={i} className="h-16" />
        ))}
      </div>
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="bg-[var(--color-card)] rounded-2xl shadow-lg p-6 border border-[var(--color-card-border)]">
      <Pulse className="h-5 w-36 mb-4" />
      <Pulse className="h-64" />
    </div>
  );
}

export function TableSkeleton() {
  return (
    <div className="bg-[var(--color-card)] rounded-2xl shadow-lg p-4 border border-[var(--color-card-border)]">
      <Pulse className="h-4 w-28 mb-3" />
      <div className="space-y-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <Pulse key={i} className="h-8" />
        ))}
      </div>
    </div>
  );
}
