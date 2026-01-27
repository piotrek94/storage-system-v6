import { Skeleton } from "./skeleton";

export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="rounded-lg border bg-card p-6 shadow-sm"
        >
          <div className="flex items-center gap-4">
            <Skeleton className="size-10 rounded-md" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
