import { PackagePlus } from "lucide-react"
import { Button } from "./ui/button"

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="mb-4 flex items-center justify-center rounded-full bg-muted p-4">
        <PackagePlus className="size-12 text-muted-foreground" />
      </div>
      <h3 className="text-xl font-semibold mb-2">No items yet</h3>
      <p className="text-muted-foreground mb-6 max-w-sm">
        Get started by adding your first item to your storage system
      </p>
      <Button asChild size="lg">
        <a href="/items/new">Add First Item</a>
      </Button>
    </div>
  )
}
