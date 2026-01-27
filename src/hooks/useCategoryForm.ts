import { useState } from 'react';

interface CategoryFormState {
  name: string;
  isValid: boolean;
  errors: string[];
  isDirty: boolean;
}

interface UseCategoryFormReturn {
  formState: CategoryFormState;
  setName: (name: string) => void;
  validate: () => boolean;
  reset: () => void;
  handleBlur: () => void;
}

/**
 * Custom hook for managing category form state and validation
 * Handles input validation for both create and edit operations
 * 
 * @param initialName - Initial name value (empty for create, current name for edit)
 * @param existingNames - Array of existing category names for uniqueness validation
 * @returns Object containing form state and helper functions
 */
export function useCategoryForm(
  initialName: string = '',
  existingNames: string[] = []
): UseCategoryFormReturn {
  const [formState, setFormState] = useState<CategoryFormState>({
    name: initialName,
    isValid: false,
    errors: [],
    isDirty: false,
  });

  /**
   * Update the name field
   */
  const setName = (name: string) => {
    setFormState(prev => ({
      ...prev,
      name,
      isDirty: true,
    }));
  };

  /**
   * Validate the form and return whether it's valid
   */
  const validate = (): boolean => {
    const errors: string[] = [];
    const trimmedName = formState.name.trim();

    // Required validation
    if (!trimmedName || trimmedName.length === 0) {
      errors.push('Category name is required');
    }

    // Length validation
    if (trimmedName.length > 255) {
      errors.push('Category name must be 255 characters or less');
    }

    // Uniqueness validation (case-insensitive)
    const isDuplicate = existingNames.some(
      existingName => existingName.toLowerCase() === trimmedName.toLowerCase()
    );

    if (isDuplicate && trimmedName.length > 0) {
      errors.push('A category with this name already exists');
    }

    const isValid = errors.length === 0;

    setFormState(prev => ({
      ...prev,
      errors,
      isValid,
    }));

    return isValid;
  };

  /**
   * Handle input blur event - triggers validation if form is dirty
   */
  const handleBlur = () => {
    if (formState.isDirty) {
      validate();
    }
  };

  /**
   * Reset form to initial state
   */
  const reset = () => {
    setFormState({
      name: initialName,
      isValid: false,
      errors: [],
      isDirty: false,
    });
  };

  return {
    formState,
    setName,
    validate,
    reset,
    handleBlur,
  };
}
