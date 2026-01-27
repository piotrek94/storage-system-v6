import { useState, useRef, useEffect } from 'react';
import { Check, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCategoryForm } from '@/hooks/useCategoryForm';
import type { CategoryListItemDTO } from '@/types';

interface CategoryEditRowProps {
  category: CategoryListItemDTO;
  onSave: (categoryId: string, newName: string) => Promise<void>;
  onCancel: () => void;
  existingNames: string[];
}

/**
 * Inline editing component for a category
 * Provides input field, validation, and save/cancel actions
 */
export default function CategoryEditRow({ 
  category, 
  onSave, 
  onCancel, 
  existingNames 
}: CategoryEditRowProps) {
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter out current category name from existing names for validation
  const otherNames = existingNames.filter(name => 
    name.toLowerCase() !== category.name.toLowerCase()
  );

  const { formState, setName, validate, handleBlur } = useCategoryForm(
    category.name,
    otherNames
  );

  // Auto-focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  /**
   * Handle save action
   */
  const handleSave = async () => {
    if (!validate()) {
      return;
    }

    setIsSaving(true);
    try {
      await onSave(category.id, formState.name);
    } catch (err) {
      // Error is handled by parent component
      console.error('Save failed:', err);
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Handle keyboard events
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  const hasErrors = formState.errors.length > 0;
  const canSave = formState.isValid && !isSaving && formState.isDirty;

  return (
    <div className="bg-accent/30 border-2 border-primary/20 rounded-md p-4">
      <div className="space-y-3">
        {/* Input Field */}
        <div>
          <Input
            ref={inputRef}
            type="text"
            value={formState.name}
            onChange={(e) => setName(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder="Enter category name"
            disabled={isSaving}
            className={hasErrors ? 'border-destructive focus-visible:ring-destructive' : ''}
            aria-invalid={hasErrors}
            aria-describedby={hasErrors ? 'edit-error' : undefined}
          />

          {/* Error Messages */}
          {hasErrors && (
            <div id="edit-error" className="mt-2 space-y-1" role="alert">
              {formState.errors.map((error, index) => (
                <p key={index} className="text-sm text-destructive">
                  {error}
                </p>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            onClick={handleSave}
            disabled={!canSave}
            size="sm"
            className="h-8"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Save
              </>
            )}
          </Button>
          <Button
            onClick={onCancel}
            disabled={isSaving}
            variant="outline"
            size="sm"
            className="h-8"
          >
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <span className="text-xs text-muted-foreground ml-2">
            Press Enter to save, Esc to cancel
          </span>
        </div>
      </div>
    </div>
  );
}
