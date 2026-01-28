import { useState } from 'react';
import { Loader2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ResetPasswordConfirmFormProps {
  token: string;
}

interface FormState {
  password: string;
  passwordConfirm: string;
  errors: {
    password?: string;
    passwordConfirm?: string;
    form?: string;
  };
  touched: {
    password: boolean;
    passwordConfirm: boolean;
  };
}

/**
 * Password reset confirmation form component
 * Allows users to set a new password using reset token
 */
export default function ResetPasswordConfirmForm({ token }: ResetPasswordConfirmFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formState, setFormState] = useState<FormState>({
    password: '',
    passwordConfirm: '',
    errors: {},
    touched: {
      password: false,
      passwordConfirm: false,
    },
  });

  /**
   * Validate password field
   */
  const validatePassword = (password: string): string | undefined => {
    if (!password) {
      return 'Password is required';
    }
    if (password.length < 8) {
      return 'Password must be at least 8 characters';
    }
    return undefined;
  };

  /**
   * Validate password confirmation field
   */
  const validatePasswordConfirm = (passwordConfirm: string): string | undefined => {
    if (!passwordConfirm) {
      return 'Please confirm your password';
    }
    if (passwordConfirm !== formState.password) {
      return "Passwords don't match";
    }
    return undefined;
  };

  /**
   * Handle field blur events
   */
  const handleBlur = (field: 'password' | 'passwordConfirm') => {
    setFormState((prev) => ({
      ...prev,
      touched: { ...prev.touched, [field]: true },
    }));

    // Validate the field
    let error: string | undefined;
    if (field === 'password') {
      error = validatePassword(formState.password);
    } else if (field === 'passwordConfirm') {
      error = validatePasswordConfirm(formState.passwordConfirm);
    }

    setFormState((prev) => ({
      ...prev,
      errors: { ...prev.errors, [field]: error },
    }));
  };

  /**
   * Handle field change events
   */
  const handleChange = (field: 'password' | 'passwordConfirm', value: string) => {
    setFormState((prev) => ({
      ...prev,
      [field]: value,
      // Clear error when user starts typing
      errors: { ...prev.errors, [field]: undefined, form: undefined },
    }));

    // Real-time validation for password confirmation
    if (field === 'passwordConfirm' && prev.touched.passwordConfirm) {
      const error = value !== formState.password ? "Passwords don't match" : undefined;
      setFormState((prev) => ({
        ...prev,
        errors: { ...prev.errors, passwordConfirm: error },
      }));
    }
  };

  /**
   * Validate entire form
   */
  const validateForm = (): boolean => {
    const passwordError = validatePassword(formState.password);
    const passwordConfirmError = validatePasswordConfirm(formState.passwordConfirm);

    setFormState((prev) => ({
      ...prev,
      errors: {
        password: passwordError,
        passwordConfirm: passwordConfirmError,
      },
      touched: {
        password: true,
        passwordConfirm: true,
      },
    }));

    return !passwordError && !passwordConfirmError;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          password: formState.password,
          passwordConfirm: formState.passwordConfirm,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setFormState((prev) => ({
          ...prev,
          errors: { ...prev.errors, form: errorData.error.message },
        }));
        return;
      }

      // Success - redirect to login with success message
      window.location.href = '/login?message=password-reset-success';
    } catch (error) {
      setFormState((prev) => ({
        ...prev,
        errors: {
          ...prev.errors,
          form: 'Unable to connect. Please check your internet connection.',
        },
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const hasPasswordError = formState.touched.password && formState.errors.password;
  const hasPasswordConfirmError =
    formState.touched.passwordConfirm && formState.errors.passwordConfirm;
  const canSubmit =
    !isLoading &&
    formState.password &&
    formState.passwordConfirm &&
    formState.password === formState.passwordConfirm;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Set new password</h1>
        <p className="text-sm text-muted-foreground">
          Enter your new password below
        </p>
      </div>

      {/* Form-level error */}
      {formState.errors.form && (
        <div
          className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-md text-sm"
          role="alert"
        >
          {formState.errors.form}
        </div>
      )}

      {/* Reset password form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Password field */}
        <div className="space-y-2">
          <Label htmlFor="password">New Password</Label>
          <Input
            id="password"
            type="password"
            value={formState.password}
            onChange={(e) => handleChange('password', e.target.value)}
            onBlur={() => handleBlur('password')}
            placeholder="••••••••"
            disabled={isLoading}
            aria-invalid={!!hasPasswordError}
            aria-describedby={hasPasswordError ? 'password-error' : undefined}
            autoComplete="new-password"
          />
          {hasPasswordError && (
            <p id="password-error" className="text-sm text-destructive" role="alert">
              {formState.errors.password}
            </p>
          )}
        </div>

        {/* Password confirmation field */}
        <div className="space-y-2">
          <Label htmlFor="passwordConfirm">Confirm New Password</Label>
          <Input
            id="passwordConfirm"
            type="password"
            value={formState.passwordConfirm}
            onChange={(e) => handleChange('passwordConfirm', e.target.value)}
            onBlur={() => handleBlur('passwordConfirm')}
            placeholder="••••••••"
            disabled={isLoading}
            aria-invalid={!!hasPasswordConfirmError}
            aria-describedby={hasPasswordConfirmError ? 'passwordConfirm-error' : undefined}
            autoComplete="new-password"
          />
          {hasPasswordConfirmError && (
            <p
              id="passwordConfirm-error"
              className="text-sm text-destructive"
              role="alert"
            >
              {formState.errors.passwordConfirm}
            </p>
          )}
        </div>

        {/* Submit button */}
        <Button type="submit" className="w-full" disabled={!canSubmit}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Resetting password...
            </>
          ) : (
            <>
              <Lock className="mr-2 h-4 w-4" />
              Reset password
            </>
          )}
        </Button>
      </form>

      {/* Back to login link */}
      <div className="text-center text-sm">
        <a
          href="/login"
          className="text-primary hover:underline underline-offset-4 font-medium"
        >
          Back to login
        </a>
      </div>
    </div>
  );
}
