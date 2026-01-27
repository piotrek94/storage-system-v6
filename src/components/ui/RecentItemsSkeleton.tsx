import { Skeleton } from "./skeleton";

export function RecentItemsSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="flex items-center gap-4 rounded-lg border bg-card p-4 shadow-sm"
        >
          <Skeleton className="size-16 rounded-md shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-32" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-5 w-24 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
