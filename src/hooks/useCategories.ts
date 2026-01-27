import { useState, useEffect } from 'react';
import type {
  CategoryListItemDTO,
  CategoryListResponseDTO,
  CreateCategoryCommand,
  UpdateCategoryCommand,
  DeleteResponseDTO,
  ErrorResponseDTO,
} from '@/types';

interface UseCategoriesReturn {
  categories: CategoryListItemDTO[];
  isLoading: boolean;
  error: string | null;
  fetchCategories: () => Promise<void>;
  createCategory: (command: CreateCategoryCommand) => Promise<CategoryListItemDTO>;
  updateCategory: (id: string, command: UpdateCategoryCommand) => Promise<CategoryListItemDTO>;
  deleteCategory: (id: string) => Promise<void>;
  refreshCategories: () => Promise<void>;
}

/**
 * Custom hook for managing category operations
 * Handles all API calls for fetching, creating, updating, and deleting categories
 * 
 * @param initialCategories - Optional initial categories data from server-side rendering
 * @returns Object containing categories state and operation functions
 */
export function useCategories(initialCategories?: CategoryListItemDTO[]): UseCategoriesReturn {
  const [categories, setCategories] = useState<CategoryListItemDTO[]>(initialCategories || []);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Sort categories alphabetically by name (case-insensitive)
   */
  const sortCategories = (cats: CategoryListItemDTO[]) => {
    return cats.sort((a, b) => 
      a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
    );
  };

  /**
   * Fetch all categories from the API
   */
  const fetchCategories = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        sort: 'name',
        order: 'asc'
      });

      const response = await fetch(`/api/categories?${params}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      // Handle authentication errors
      if (response.status === 401) {
        window.location.href = '/login';
        return;
      }

      if (!response.ok) {
        const errorData: ErrorResponseDTO = await response.json();
        throw new Error(errorData.error.message);
      }

      const data: CategoryListResponseDTO = await response.json();
      setCategories(sortCategories(data.data));
    } catch (err) {
      const errorMessage = err instanceof TypeError 
        ? 'Network error. Please check your connection and try again.'
        : err instanceof Error 
        ? err.message 
        : 'An unexpected error occurred';
      
      setError(errorMessage);
      console.error('Failed to fetch categories:', err);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Create a new category
   */
  const createCategory = async (command: CreateCategoryCommand): Promise<CategoryListItemDTO> => {
    setError(null);

    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(command)
      });

      // Handle authentication errors
      if (response.status === 401) {
        window.location.href = '/login';
        throw new Error('Unauthorized');
      }

      if (!response.ok) {
        const errorData: ErrorResponseDTO = await response.json();
        throw new Error(errorData.error.message);
      }

      const newCategory: CategoryListItemDTO = await response.json();
      
      // Refresh categories list after successful creation
      await refreshCategories();
      
      return newCategory;
    } catch (err) {
      const errorMessage = err instanceof TypeError 
        ? 'Network error. Please check your connection and try again.'
        : err instanceof Error 
        ? err.message 
        : 'An unexpected error occurred';
      
      console.error('Failed to create category:', err);
      throw new Error(errorMessage);
    }
  };

  /**
   * Update an existing category
   */
  const updateCategory = async (
    id: string, 
    command: UpdateCategoryCommand
  ): Promise<CategoryListItemDTO> => {
    setError(null);

    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(command)
      });

      // Handle authentication errors
      if (response.status === 401) {
        window.location.href = '/login';
        throw new Error('Unauthorized');
      }

      if (!response.ok) {
        const errorData: ErrorResponseDTO = await response.json();
        throw new Error(errorData.error.message);
      }

      const updatedCategory: CategoryListItemDTO = await response.json();
      
      // Refresh categories list after successful update
      await refreshCategories();
      
      return updatedCategory;
    } catch (err) {
      const errorMessage = err instanceof TypeError 
        ? 'Network error. Please check your connection and try again.'
        : err instanceof Error 
        ? err.message 
        : 'An unexpected error occurred';
      
      console.error('Failed to update category:', err);
      throw new Error(errorMessage);
    }
  };

  /**
   * Delete a category
   */
  const deleteCategory = async (id: string): Promise<void> => {
    setError(null);

    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });

      // Handle authentication errors
      if (response.status === 401) {
        window.location.href = '/login';
        throw new Error('Unauthorized');
      }

      if (!response.ok) {
        const errorData: ErrorResponseDTO = await response.json();
        throw new Error(errorData.error.message);
      }

      // Refresh categories list after successful deletion
      await refreshCategories();
    } catch (err) {
      const errorMessage = err instanceof TypeError 
        ? 'Network error. Please check your connection and try again.'
        : err instanceof Error 
        ? err.message 
        : 'An unexpected error occurred';
      
      console.error('Failed to delete category:', err);
      throw new Error(errorMessage);
    }
  };

  /**
   * Refresh the categories list (alias for fetchCategories)
   */
  const refreshCategories = async () => {
    await fetchCategories();
  };

  // Fetch categories on mount if no initial data provided
  useEffect(() => {
    if (!initialCategories || initialCategories.length === 0) {
      fetchCategories();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    categories,
    isLoading,
    error,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    refreshCategories,
  };
}
