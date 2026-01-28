import { useState } from 'react';
import { Loader2, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface LoginFormProps {
  redirectTo?: string;
}

interface FormState {
  email: string;
  password: string;
  errors: {
    email?: string;
    password?: string;
    form?: string;
  };
  touched: {
    email: boolean;
    password: boolean;
  };
}

/**
 * Login form component with validation
 * Handles user authentication via email/password
 */
export default function LoginForm({ redirectTo }: LoginFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formState, setFormState] = useState<FormState>({
    email: '',
    password: '',
    errors: {},
    touched: {
      email: false,
      password: false,
    },
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
   * Handle field blur events
   */
  const handleBlur = (field: 'email' | 'password') => {
    setFormState((prev) => ({
      ...prev,
      touched: { ...prev.touched, [field]: true },
    }));

    // Validate the field
    let error: string | undefined;
    if (field === 'email') {
      error = validateEmail(formState.email);
    } else if (field === 'password') {
      error = validatePassword(formState.password);
    }

    setFormState((prev) => ({
      ...prev,
      errors: { ...prev.errors, [field]: error },
    }));
  };

  /**
   * Handle field change events
   */
  const handleChange = (field: 'email' | 'password', value: string) => {
    setFormState((prev) => ({
      ...prev,
      [field]: value,
      // Clear error when user starts typing
      errors: { ...prev.errors, [field]: undefined, form: undefined },
    }));
  };

  /**
   * Validate entire form
   */
  const validateForm = (): boolean => {
    const emailError = validateEmail(formState.email);
    const passwordError = validatePassword(formState.password);

    setFormState((prev) => ({
      ...prev,
      errors: {
        email: emailError,
        password: passwordError,
      },
      touched: {
        email: true,
        password: true,
      },
    }));

    return !emailError && !passwordError;
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
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formState.email,
          password: formState.password,
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

      // Success - redirect to dashboard or original destination
      window.location.href = redirectTo || '/dashboard';
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
  const hasPasswordError = formState.touched.password && formState.errors.password;
  const canSubmit = !isLoading && formState.email && formState.password;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
        <p className="text-sm text-muted-foreground">
          Enter your email and password to sign in
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

      {/* Login form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email field */}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formState.email}
            onChange={(e) => handleChange('email', e.target.value)}
            onBlur={() => handleBlur('email')}
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

        {/* Password field */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <a
              href="/reset-password"
              className="text-sm text-primary hover:underline underline-offset-4"
            >
              Forgot password?
            </a>
          </div>
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
            autoComplete="current-password"
          />
          {hasPasswordError && (
            <p id="password-error" className="text-sm text-destructive" role="alert">
              {formState.errors.password}
            </p>
          )}
        </div>

        {/* Submit button */}
        <Button type="submit" className="w-full" disabled={!canSubmit}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : (
            <>
              <LogIn className="mr-2 h-4 w-4" />
              Sign in
            </>
          )}
        </Button>
      </form>

      {/* Register link */}
      <div className="text-center text-sm">
        <span className="text-muted-foreground">Don't have an account? </span>
        <a
          href="/register"
          className="text-primary hover:underline underline-offset-4 font-medium"
        >
          Sign up
        </a>
      </div>
    </div>
  );
}
