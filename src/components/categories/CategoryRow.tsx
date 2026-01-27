import { Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { CategoryListItemDTO } from '@/types';

interface CategoryRowProps {
  category: CategoryListItemDTO;
  onEdit: (categoryId: string) => void;
  onDelete: (category: CategoryListItemDTO) => void;
}

/**
 * Display mode component for a single category
 * Shows category name, item count, and action buttons
 */
export default function CategoryRow({ category, onEdit, onDelete }: CategoryRowProps) {
  const itemCountText = category.itemCount === 1 ? '1 item' : `${category.itemCount} items`;

  return (
    <div className="bg-card border rounded-md p-4 flex items-center justify-between hover:bg-accent/50 transition-colors group">
      {/* Category Info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-base truncate">{category.name}</h3>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="secondary" className="text-xs">
            {itemCountText}
          </Badge>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 ml-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onEdit(category.id)}
          aria-label={`Edit ${category.name}`}
          className="h-9 w-9 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(category)}
          aria-label={`Delete ${category.name}`}
          className="h-9 w-9 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
