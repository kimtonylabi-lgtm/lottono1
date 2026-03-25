import { RecommendationSkeleton, StatsSkeleton, ChartSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <main className="flex-1 p-4 max-w-lg mx-auto w-full space-y-4 pb-8">
      <div className="flex items-center justify-between pt-2 pb-2">
        <div>
          <div className="h-6 w-32 bg-[var(--color-surface)] rounded animate-pulse" />
          <div className="h-3 w-48 bg-[var(--color-surface)] rounded animate-pulse mt-1" />
        </div>
        <div className="w-9 h-9 bg-[var(--color-surface)] rounded-full animate-pulse" />
      </div>
      <div className="h-10 bg-[var(--color-surface)] rounded-xl animate-pulse" />
      <RecommendationSkeleton />
      <StatsSkeleton />
      <ChartSkeleton />
    </main>
  );
}
