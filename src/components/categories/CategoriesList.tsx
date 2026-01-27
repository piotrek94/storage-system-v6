import { useState } from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useCategories } from '@/hooks/useCategories';
import CategoryRow from './CategoryRow';
import CategoryEditRow from './CategoryEditRow';
import CategoryCreateForm from './CategoryCreateForm';
import type { CategoryListItemDTO } from '@/types';

// These will be implemented in later steps
// import DeleteConfirmationModal from './DeleteConfirmationModal';
// import EmptyState from './EmptyState';

interface CategoriesListProps {
  initialCategories?: CategoryListItemDTO[];
}

interface DeleteModalState {
  isOpen: boolean;
  category: CategoryListItemDTO | null;
}

/**
 * Main component for the Categories List/Management page
 * Orchestrates all category operations and child component rendering
 */
export default function CategoriesList({ initialCategories }: CategoriesListProps) {
  const [createFormVisible, setCreateFormVisible] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [deleteModalState, setDeleteModalState] = useState<DeleteModalState>({
    isOpen: false,
    category: null,
  });

  const {
    categories,
    isLoading,
    error,
    createCategory,
    updateCategory,
    deleteCategory,
  } = useCategories(initialCategories);

  /**
   * Handler for "Add Category" button click
   */
  const handleAddClick = () => {
    setCreateFormVisible(true);
    setEditingCategoryId(null); // Ensure edit mode is closed
  };

  /**
   * Handler for create form save
   */
  const handleCreateSave = async (name: string) => {
    try {
      await createCategory({ name: name.trim() });
      setCreateFormVisible(false);
      toast.success('Category created successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create category';
      toast.error(errorMessage);
      throw err; // Re-throw to let form handle inline errors
    }
  };

  /**
   * Handler for create form cancel
   */
  const handleCreateCancel = () => {
    setCreateFormVisible(false);
  };

  /**
   * Handler for edit button click
   */
  const handleEditClick = (categoryId: string) => {
    setEditingCategoryId(categoryId);
    setCreateFormVisible(false); // Ensure create form is closed
  };

  /**
   * Handler for edit form save
   */
  const handleEditSave = async (categoryId: string, newName: string) => {
    try {
      await updateCategory(categoryId, { name: newName.trim() });
      setEditingCategoryId(null);
      toast.success('Category updated successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update category';
      
      // Check for 404 error
      if (errorMessage.includes('not found')) {
        toast.error('Category not found. It may have been deleted.');
        setEditingCategoryId(null);
      } else {
        toast.error(errorMessage);
      }
      throw err; // Re-throw to let form handle inline errors
    }
  };

  /**
   * Handler for edit form cancel
   */
  const handleEditCancel = () => {
    setEditingCategoryId(null);
  };

  /**
   * Handler for delete button click
   */
  const handleDeleteClick = (category: CategoryListItemDTO) => {
    setDeleteModalState({
      isOpen: true,
      category,
    });
  };

  /**
   * Handler for delete confirmation
   */
  const handleDeleteConfirm = async (categoryId: string) => {
    try {
      await deleteCategory(categoryId);
      setDeleteModalState({ isOpen: false, category: null });
      toast.success('Category deleted successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete category';
      toast.error(errorMessage);
      setDeleteModalState({ isOpen: false, category: null });
    }
  };

  /**
   * Handler for delete modal cancel
   */
  const handleDeleteCancel = () => {
    setDeleteModalState({ isOpen: false, category: null });
  };

  /**
   * Handler for empty state "Add First Category" button
   */
  const handleAddFirstCategory = () => {
    setCreateFormVisible(true);
  };

  // Get existing category names for validation (excluding current editing category)
  const getExistingNames = (excludeCategoryId?: string) => {
    return categories
      .filter(cat => cat.id !== excludeCategoryId)
      .map(cat => cat.name);
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Categories</h1>
        {!createFormVisible && (
          <Button onClick={handleAddClick}>
            <Plus className="mr-2 h-4 w-4" />
            Add Category
          </Button>
        )}
      </div>

      {/* Global Error Display */}
      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md mb-4">
          {error}
        </div>
      )}

      {/* Create Form */}
      {createFormVisible && (
        <CategoryCreateForm
          onSave={handleCreateSave}
          onCancel={handleCreateCancel}
          existingNames={getExistingNames()}
        />
      )}

      {/* Categories List or Empty State */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            You haven't added any categories yet
          </p>
          <Button onClick={handleAddFirstCategory}>
            <Plus className="mr-2 h-4 w-4" />
            Add Your First Category
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {categories.map((category) => {
            const isEditing = editingCategoryId === category.id;
            
            if (isEditing) {
              return (
                <CategoryEditRow
                  key={category.id}
                  category={category}
                  onSave={handleEditSave}
                  onCancel={handleEditCancel}
                  existingNames={getExistingNames(category.id)}
                />
              );
            }
            
            return (
              <CategoryRow
                key={category.id}
                category={category}
                onEdit={handleEditClick}
                onDelete={handleDeleteClick}
              />
            );
          })}
        </div>
      )}

      {/* Delete Modal - Will be implemented in next steps */}
      {deleteModalState.isOpen && deleteModalState.category && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card p-6 rounded-lg max-w-md">
            <h2 className="text-xl font-bold mb-4">Delete Category</h2>
            <p className="mb-4">
              Delete confirmation modal will be implemented in the next step
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Category: {deleteModalState.category.name} ({deleteModalState.category.itemCount} items)
            </p>
            <div className="flex gap-2 justify-end">
              <Button onClick={handleDeleteCancel} variant="outline">
                Cancel
              </Button>
              <Button
                onClick={() => handleDeleteConfirm(deleteModalState.category!.id)}
                variant="destructive"
                disabled={deleteModalState.category.itemCount > 0}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
