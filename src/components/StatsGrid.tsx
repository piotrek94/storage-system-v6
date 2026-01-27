import { Package, Box, Tag, AlertCircle } from "lucide-react"
import { StatCard } from "./StatCard"
import { StatsSkeleton } from "./ui/StatsSkeleton"

interface StatsGridProps {
  totalItems: number
  totalContainers: number
  totalCategories: number
  itemsOut: number
  isLoading?: boolean
}

export function StatsGrid({
  totalItems,
  totalContainers,
  totalCategories,
  itemsOut,
  isLoading = false,
}: StatsGridProps) {
  if (isLoading) {
    return <StatsSkeleton />
  }

  // Ensure all counts are non-negative integers
  const safeCount = (count: number | undefined | null): number => {
    return typeof count === "number" && count >= 0 ? Math.floor(count) : 0
  }

  const stats = [
    {
      id: "total-items",
      icon: Package,
      label: "Total Items",
      count: safeCount(totalItems),
      href: "/items",
      variant: "default" as const,
    },
    {
      id: "total-containers",
      icon: Box,
      label: "Total Containers",
      count: safeCount(totalContainers),
      href: "/containers",
      variant: "default" as const,
    },
    {
      id: "total-categories",
      icon: Tag,
      label: "Total Categories",
      count: safeCount(totalCategories),
      href: "/categories",
      variant: "default" as const,
    },
    {
      id: "items-out",
      icon: AlertCircle,
      label: "Items Out",
      count: safeCount(itemsOut),
      href: "/items?filter=out",
      variant: "warning" as const,
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <StatCard
          key={stat.id}
          icon={stat.icon}
          label={stat.label}
          count={stat.count}
          href={stat.href}
          variant={stat.variant}
        />
      ))}
    </div>
  )
}
