import { CheckCircle, XCircle } from "lucide-react"
import { Badge } from "./ui/badge"
import { cn } from "@/lib/utils"
import type { RecentItemDTO } from "@/types"

interface RecentItemCardProps {
  item: RecentItemDTO
}

export function RecentItemCard({ item }: RecentItemCardProps) {
  const thumbnailUrl = item.thumbnail && item.thumbnail.trim().length > 0
    ? item.thumbnail
    : "/images/placeholder-item.png"

  const StatusIcon = item.isIn ? CheckCircle : XCircle

  return (
    <a
      href={`/items/${item.id}`}
      className={cn(
        "group flex items-center gap-4 rounded-lg border bg-card p-4 shadow-sm transition-all",
        "hover:shadow-md hover:-translate-y-0.5",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "active:translate-y-0"
      )}
      aria-label={`View details for ${item.name}`}
    >
      <div className="relative size-16 shrink-0 overflow-hidden rounded-md bg-muted">
        <img
          src={thumbnailUrl}
          alt={item.name}
          className="size-full object-cover"
          onError={(e) => {
            e.currentTarget.src = "/images/placeholder-item.png"
          }}
        />
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-base mb-2 truncate group-hover:text-primary transition-colors">
          {item.name}
        </h3>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="default" className="text-xs">
            {item.category}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {item.container}
          </Badge>
        </div>
      </div>

      <div className="shrink-0">
        <StatusIcon
          className={cn(
            "size-5",
            item.isIn
              ? "text-green-600 dark:text-green-400"
              : "text-orange-600 dark:text-orange-400"
          )}
          aria-label={item.isIn ? "In storage" : "Out of storage"}
        />
      </div>
    </a>
  )
}
