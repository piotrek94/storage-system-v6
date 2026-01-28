import { useState } from 'react';
import { Loader2, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface FormState {
  email: string;
  errors: {
    email?: string;
    form?: string;
  };
  touched: {
    email: boolean;
  };
  success: boolean;
}

/**
 * Password reset request form component
 * Allows users to request a password reset email
 */
export default function ResetPasswordRequestForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [formState, setFormState] = useState<FormState>({
    email: '',
    errors: {},
    touched: {
      email: false,
    },
    success: false,
  });

  /**
   * Validate email field
   */
  const validateEmail = (email: string): string | undefined => {
    if (!email.trim()) {
      return 'Email is required';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address';
    }
    if (email.length > 255) {
      return 'Email is too long';
    }
    return undefined;
  };

  /**
   * Handle field blur event
   */
  const handleBlur = () => {
    setFormState((prev) => ({
      ...prev,
      touched: { email: true },
    }));

    const error = validateEmail(formState.email);
    setFormState((prev) => ({
      ...prev,
      errors: { ...prev.errors, email: error },
    }));
  };

  /**
   * Handle field change event
   */
  const handleChange = (value: string) => {
    setFormState((prev) => ({
      ...prev,
      email: value,
      errors: { email: undefined, form: undefined },
      success: false,
    }));
  };

  /**
   * Validate form
   */
  const validateForm = (): boolean => {
    const emailError = validateEmail(formState.email);

    setFormState((prev) => ({
      ...prev,
      errors: { email: emailError },
      touched: { email: true },
    }));

    return !emailError;
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
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formState.email,
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

      // Success - show success message
      setFormState((prev) => ({
        ...prev,
        success: true,
        errors: {},
      }));

      // Redirect to login after 5 seconds
      setTimeout(() => {
        window.location.href = '/login';
      }, 5000);
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

  const hasEmailError = formState.touched.email && formState.errors.email;
  const canSubmit = !isLoading && formState.email;

  // Show success message
  if (formState.success) {
    return (
      <div className="space-y-6">
        <div className="space-y-2 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Check your email</h1>
          <p className="text-sm text-muted-foreground">
            If an account exists with this email, a password reset link has been sent.
          </p>
        </div>

        <div className="bg-muted px-4 py-3 rounded-md text-sm text-center">
          <p>Redirecting to login page in 5 seconds...</p>
        </div>

        <div className="text-center">
          <a
            href="/login"
            className="text-sm text-primary hover:underline underline-offset-4"
          >
            Return to login now
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Reset your password</h1>
        <p className="text-sm text-muted-foreground">
          Enter your email address and we'll send you a reset link
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
        {/* Email field */}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formState.email}
            onChange={(e) => handleChange(e.target.value)}
            onBlur={handleBlur}
            placeholder="you@example.com"
            disabled={isLoading}
            aria-invalid={!!hasEmailError}
            aria-describedby={hasEmailError ? 'email-error' : undefined}
            autoComplete="email"
          />
          {hasEmailError && (
            <p id="email-error" className="text-sm text-destructive" role="alert">
              {formState.errors.email}
            </p>
          )}
        </div>

        {/* Submit button */}
        <Button type="submit" className="w-full" disabled={!canSubmit}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending reset link...
            </>
          ) : (
            <>
              <Mail className="mr-2 h-4 w-4" />
              Send reset link
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
