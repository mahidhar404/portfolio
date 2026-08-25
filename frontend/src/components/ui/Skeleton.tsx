import { cn } from "@/lib/cn";

/**
 * Loading placeholders sized to the content they replace, so nothing shifts
 * when the real data arrives.
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse rounded bg-raised", className)}
    />
  );
}

export function SectionSkeleton() {
  return (
    <div className="space-y-4 py-14">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-9 w-64" />
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    </div>
  );
}
