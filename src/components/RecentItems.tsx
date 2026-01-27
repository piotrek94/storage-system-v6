import { RecentItemCard } from "./RecentItemCard"
import { EmptyState } from "./EmptyState"
import { RecentItemsSkeleton } from "./ui/RecentItemsSkeleton"
import type { RecentItemDTO } from "@/types"

interface RecentItemsProps {
  items: RecentItemDTO[]
  isLoading?: boolean
}

export function RecentItems({ items, isLoading = false }: RecentItemsProps) {
  if (isLoading) {
    return (
      <div>
        <h2 className="text-2xl font-semibold mb-4">Recently Added Items</h2>
        <RecentItemsSkeleton />
      </div>
    )
  }

  // Validate and filter items
  const validItems = items.filter(
    (item) =>
      item &&
      typeof item.id === "string" &&
      item.id.trim().length > 0 &&
      typeof item.name === "string" &&
      item.name.trim().length > 0
  )

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Recently Added Items</h2>
      {validItems.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-3">
          {validItems.map((item) => (
            <RecentItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  )
}
