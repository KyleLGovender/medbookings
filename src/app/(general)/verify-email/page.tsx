'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

import { ArrowLeft, Mail, RefreshCw } from 'lucide-react';
import { useSession } from 'next-auth/react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function VerifyEmailPage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  const attemptedRoute = searchParams.get('attempted_route');
  const reason = searchParams.get('reason');

  const resendVerificationEmail = async () => {
    if (!session?.user?.email) return;

    setIsResending(true);
    setResendMessage('');

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: session.user.email }),
      });

      if (response.ok) {
        setResendMessage('Verification email sent! Please check your inbox.');
      } else {
        setResendMessage('Failed to send verification email. Please try again.');
      }
    } catch (error) {
      setResendMessage('An error occurred. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const getFeatureName = (route: string) => {
    if (route.includes('/providers')) return 'Provider Registration';
    if (route.includes('/calendar')) return 'Calendar Management';
    if (route.includes('/availability')) return 'Availability Management';
    if (route.includes('/bookings')) return 'Booking System';
    return 'this feature';
  };

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[450px]">
        <div className="flex flex-col space-y-2 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
            <Mail className="h-6 w-6 text-orange-600" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Email Verification Required</h1>
          <p className="text-sm text-muted-foreground">
            Please verify your email address to access this feature
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Verify Your Email</CardTitle>
            <CardDescription>
              {attemptedRoute &&
                `To access ${getFeatureName(attemptedRoute)}, you need to verify your email address first.`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {reason === 'email_verification_required' && (
              <Alert>
                <AlertDescription>
                  This feature requires email verification to ensure account security and prevent
                  unauthorized access.
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <p className="text-sm">We&apos;ve sent a verification link to:</p>
              <p className="rounded bg-muted px-3 py-2 text-sm font-medium">
                {session?.user?.email}
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Please check your email and click the verification link. If you don&apos;t see the
                email, check your spam folder.
              </p>
            </div>

            {resendMessage && (
              <Alert>
                <AlertDescription>{resendMessage}</AlertDescription>
              </Alert>
            )}

            <div className="flex flex-col space-y-2">
              <Button
                onClick={resendVerificationEmail}
                disabled={isResending}
                variant="default"
                className="w-full"
              >
                {isResending ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Resend Verification Email'
                )}
              </Button>

              <Button
                onClick={() => router.push('/dashboard')}
                variant="outline"
                className="w-full"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Return to Dashboard
              </Button>
            </div>

            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                Once you&apos;ve verified your email, you&apos;ll have access to all features
                including:
              </p>
              <ul className="mt-1 space-y-1 text-xs text-muted-foreground">
                <li>• Healthcare Provider Registration</li>
                <li>• Calendar and Availability Management</li>
                <li>• Booking System Access</li>
                <li>• Organization Management (Admin only)</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
