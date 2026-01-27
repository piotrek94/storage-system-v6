import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  count: number;
  href: string;
  variant?: "default" | "warning";
}

export function StatCard({ icon: Icon, label, count, href, variant = "default" }: StatCardProps) {
  const isWarning = variant === "warning" && count > 0;
  
  return (
    <a
      href={href}
      className={cn(
        "group block rounded-lg border bg-card p-6 shadow-sm transition-all",
        "hover:shadow-md hover:-translate-y-0.5",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "active:translate-y-0",
        isWarning && "border-orange-500/50 dark:border-orange-500/30"
      )}
      aria-label={`View all ${count} ${label.toLowerCase()}`}
    >
      <div className="flex items-center gap-4">
        <div
          className={cn(
            "flex size-10 items-center justify-center rounded-md transition-colors",
            isWarning
              ? "bg-orange-500/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400"
              : "bg-primary/10 text-primary dark:bg-primary/20"
          )}
        >
          <Icon className="size-5" />
        </div>
        <div className="flex-1">
          <div
            className={cn(
              "text-3xl font-bold tabular-nums",
              isWarning && "text-orange-600 dark:text-orange-400"
            )}
          >
            {count}
          </div>
          <div className="text-sm text-muted-foreground">{label}</div>
        </div>
      </div>
    </a>
  );
}
