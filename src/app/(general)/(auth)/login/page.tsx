'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import React, { Suspense, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { signIn } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useEmailVerification } from '@/hooks/use-email-verification';
import { useToast } from '@/hooks/use-toast';

// Validation schemas
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const registerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

// Google SVG Icon (simplified)
const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path
      fill="currentColor"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="currentColor"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="currentColor"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="currentColor"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { verifyEmail } = useEmailVerification();
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const error = searchParams.get('error');
  const verificationToken = searchParams.get('verificationToken');
  const message = searchParams.get('message');

  // Error messages map
  const errorMessages: { [key: string]: string } = {
    UserNotFound:
      'No account found with this email address. Please create an account first using the Sign Up link below.',
    InvalidPassword: 'Incorrect password. Please check your password and try again.',
    OAuthUserAttemptingCredentials:
      'This email is linked to a Google account. Please sign in using the "Continue with Google" button above.',
    CredentialsRequired: 'Please enter both email and password.',
    AuthenticationFailed: 'Authentication failed. Please try again.',
    OAuthCallback: 'There was an error during the authentication process. Please try again.',
    CredentialsSignin: 'Sign in failed. Check the details you provided are correct.',
    'invalid-verification-token':
      'The verification link you clicked is invalid. Please try requesting a new verification email.',
    'verification-token-expired':
      'The verification link has expired. Please request a new verification email.',
    'verification-failed': 'Email verification failed. Please try again or contact support.',
    'user-not-found': 'User account not found. Please create an account first.',
    Default: 'An unknown error occurred during authentication. Please try again.',
  };

  // Login form
  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Register form
  const registerForm = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  });

  // Clear error from URL
  const clearError = () => {
    if (error) {
      router.replace('/login', { scroll: false });
    }
  };

  // Handle login
  const onLogin = async (data: LoginForm) => {
    clearError(); // Clear any existing errors before attempting login
    setIsLoading(true);
    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        // Redirect to login page with error parameter to show persistent error
        router.push(`/login?error=${result.error}`);
      } else {
        // If login successful and we have a verification token, complete verification
        if (verificationToken) {
          await verifyEmail(verificationToken);
        }
        router.push('/');
      }
    } catch (error) {
      // Redirect to login page with generic error
      router.push('/login?error=AuthenticationFailed');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle registration
  const onRegister = async (data: RegisterForm) => {
    clearError(); // Clear any existing errors before attempting registration
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = (await response.json()) as { error?: string; success?: boolean };

      if (!response.ok) {
        toast({
          title: 'Registration failed',
          description: result.error || 'An error occurred during registration',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Account created!',
        description: 'Please check your email to verify your account before signing in.',
      });

      // Switch to login form
      setIsRegistering(false);
      registerForm.reset();
    } catch (error) {
      toast({
        title: 'Registration failed',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            {isRegistering ? 'Create an account' : 'Welcome back'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isRegistering
              ? 'Enter your information to create your account'
              : 'Enter your credentials to sign in to your account'}
          </p>
        </div>

        {/* Auth error display */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{errorMessages[error] || errorMessages.Default}</AlertDescription>
          </Alert>
        )}

        {/* Email verification messages */}
        {message === 'email-verification-pending' && verificationToken && (
          <Alert>
            <AlertDescription>
              <strong>Email verification required:</strong> Please sign in to complete your email
              verification. Your email will be verified automatically after successful
              authentication.
            </AlertDescription>
          </Alert>
        )}

        {message === 'email-verified-please-login' && (
          <Alert>
            <AlertDescription>
              <strong>Email verified successfully!</strong> Your email has been verified. Please
              sign in to access your account.
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>{isRegistering ? 'Register' : 'Sign In'}</CardTitle>
            <CardDescription>
              {isRegistering
                ? 'Create your MedBookings account'
                : 'Sign in to your MedBookings account'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Google OAuth Button */}
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                clearError(); // Clear any existing errors before attempting Google OAuth
                let callbackUrl = isRegistering ? '/?newUser=true' : '/';

                // If we have a verification token, preserve it in the callback URL
                if (verificationToken) {
                  const url = new URL(callbackUrl, window.location.origin);
                  url.searchParams.set('verificationToken', verificationToken);
                  callbackUrl = url.pathname + url.search;
                }

                signIn('google', { callbackUrl });
              }}
              disabled={isLoading}
            >
              <GoogleIcon />
              {isRegistering ? 'Register with Google' : 'Continue with Google'}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or</span>
              </div>
            </div>

            {/* Email/Password Forms */}
            {isRegistering ? (
              <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                <div>
                  <Label htmlFor="register-name">Name</Label>
                  <Input
                    id="register-name"
                    placeholder="John Doe"
                    {...registerForm.register('name')}
                    disabled={isLoading}
                  />
                  {registerForm.formState.errors.name && (
                    <p className="text-sm text-red-600">
                      {registerForm.formState.errors.name.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="register-email">Email</Label>
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="john@example.com"
                    {...registerForm.register('email')}
                    disabled={isLoading}
                  />
                  {registerForm.formState.errors.email && (
                    <p className="text-sm text-red-600">
                      {registerForm.formState.errors.email.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="register-password">Password</Label>
                  <Input
                    id="register-password"
                    type="password"
                    placeholder="••••••••"
                    {...registerForm.register('password')}
                    disabled={isLoading}
                  />
                  {registerForm.formState.errors.password && (
                    <p className="text-sm text-red-600">
                      {registerForm.formState.errors.password.message}
                    </p>
                  )}
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Creating account...' : 'Create account'}
                </Button>
              </form>
            ) : (
              <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                <div>
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="john@example.com"
                    {...loginForm.register('email')}
                    disabled={isLoading}
                  />
                  {loginForm.formState.errors.email && (
                    <p className="text-sm text-red-600">
                      {loginForm.formState.errors.email.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    {...loginForm.register('password')}
                    disabled={isLoading}
                  />
                  {loginForm.formState.errors.password && (
                    <p className="text-sm text-red-600">
                      {loginForm.formState.errors.password.message}
                    </p>
                  )}
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Signing in...' : 'Sign in'}
                </Button>
              </form>
            )}

            <div className="text-center">
              <button
                type="button"
                className="text-sm text-muted-foreground underline hover:text-primary"
                onClick={() => {
                  clearError(); // Clear errors when switching between sign-in and registration
                  setIsRegistering(!isRegistering);
                  loginForm.reset();
                  registerForm.reset();
                }}
                disabled={isLoading}
              >
                {
                  isRegistering
                    ? 'Already have an account? Sign in'
                    : "Don't have an account? Sign up" /* eslint-disable-line quotes */
                }{' '}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="container flex h-screen w-screen flex-col items-center justify-center">
          <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
            <div className="flex flex-col space-y-2 text-center">
              <h1 className="text-2xl font-semibold tracking-tight">Loading...</h1>
              <p className="text-sm text-muted-foreground">
                Please wait while we load the login page
              </p>
            </div>
          </div>
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
