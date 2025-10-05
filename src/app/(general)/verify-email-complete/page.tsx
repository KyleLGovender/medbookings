'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';

import { useSession } from 'next-auth/react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useEmailVerification } from '@/hooks/use-email-verification';
import { logger } from '@/lib/logger';
import { nowUTC } from '@/lib/timezone';

function VerifyEmailCompleteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status, update } = useSession();
  const { verifyEmail } = useEmailVerification();
  const [verificationStatus, setVerificationStatus] = useState<
    'pending' | 'success' | 'error' | 'already-verified'
  >('pending');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUpdatingSession, setIsUpdatingSession] = useState(false);
  const hasAttemptedVerification = useRef(false);

  const verificationToken = searchParams.get('verificationToken');
  const encodedEmail = searchParams.get('email');

  // Decode email from base64 (for race condition handling)
  const userEmail = encodedEmail
    ? Buffer.from(encodedEmail, 'base64').toString('utf-8')
    : undefined;

  // Create a robust cleanup function for localStorage
  const cleanupLocalStorage = useCallback((token: string) => {
    const tokenKey = `verification_attempted_${token}`;
    const resultKey = `${tokenKey}_result`;

    try {
      localStorage.removeItem(tokenKey);
      localStorage.removeItem(resultKey);
      logger.info('Cleaned up localStorage for verification token', {
        tokenPrefix: token.substring(0, 10),
      });
    } catch (error) {
      logger.warn('Failed to cleanup localStorage', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }, []);

  // Cleanup expired verification entries (older than 24 hours)
  const cleanupExpiredEntries = useCallback(() => {
    try {
      const oneDay = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
      const now = nowUTC().getTime();

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('verification_attempted_')) {
          const item = localStorage.getItem(key);
          if (item) {
            try {
              // Check if this is a timestamp (simple verification entries store 'true')
              const timestamp = parseInt(item);
              if (!isNaN(timestamp) && now - timestamp > oneDay) {
                localStorage.removeItem(key);
                localStorage.removeItem(`${key}_result`);
                logger.info('Cleaned up expired localStorage entry', { key });
              }
            } catch {
              // If it's not a timestamp, assume it's old format and clean up if older than 24h
              const storedTime = localStorage.getItem(`${key}_timestamp`);
              if (!storedTime || now - parseInt(storedTime) > oneDay) {
                localStorage.removeItem(key);
                localStorage.removeItem(`${key}_result`);
                localStorage.removeItem(`${key}_timestamp`);
              }
            }
          }
        }
      }
    } catch (error) {
      logger.warn('Failed to cleanup expired localStorage entries', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }, []);

  // Cleanup on component mount (expired entries)
  useEffect(() => {
    cleanupExpiredEntries();
  }, [cleanupExpiredEntries]);

  // Cleanup on page unload/navigation
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (
        verificationToken &&
        (verificationStatus === 'success' || verificationStatus === 'already-verified')
      ) {
        cleanupLocalStorage(verificationToken);
      }
    };

    const handleVisibilityChange = () => {
      if (
        document.visibilityState === 'hidden' &&
        verificationToken &&
        (verificationStatus === 'success' || verificationStatus === 'already-verified')
      ) {
        cleanupLocalStorage(verificationToken);
      }
    };

    // Add event listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup on component unmount
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);

      // Final cleanup when component unmounts
      if (
        verificationToken &&
        (verificationStatus === 'success' || verificationStatus === 'already-verified')
      ) {
        cleanupLocalStorage(verificationToken);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verificationToken, verificationStatus]); // cleanupLocalStorage is stable (useCallback)

  // Main verification effect
  useEffect(() => {
    if (!verificationToken || status === 'loading' || isProcessing || isUpdatingSession) return;

    // Create a unique key for this verification token
    const tokenKey = `verification_attempted_${verificationToken}`;

    // Check if we've already attempted this token (across all renders/page loads)
    const existingAttempt = localStorage.getItem(tokenKey);
    if (hasAttemptedVerification.current || existingAttempt) {
      // If we already processed this token, check what the result was
      const result = localStorage.getItem(`${tokenKey}_result`);
      if (result) {
        setVerificationStatus(result as 'success' | 'error' | 'already-verified');
        setIsProcessing(false);

        // If this is a successful cached result, schedule cleanup
        if (result === 'success' || result === 'already-verified') {
          setTimeout(() => {
            cleanupLocalStorage(verificationToken);
          }, 2000);
        }
      }
      return;
    }

    // Mark as attempted immediately with timestamp
    hasAttemptedVerification.current = true;
    localStorage.setItem(tokenKey, nowUTC().getTime().toString());
    setIsProcessing(true);

    // Get stable references to avoid re-creating the async function
    const verifyEmailRef = verifyEmail;
    const updateRef = update;

    const processVerification = async () => {
      try {
        const result = await verifyEmailRef(verificationToken, userEmail);
        setVerificationStatus(result);
        localStorage.setItem(`${tokenKey}_result`, result);

        // If user is authenticated and verification succeeded, refresh their session
        if ((result === 'success' || result === 'already-verified') && status === 'authenticated') {
          setIsUpdatingSession(true);
          try {
            await updateRef(); // Refresh NextAuth session to pick up emailVerified status
            logger.info('Session updated successfully after email verification');
          } catch (error) {
            logger.error('Failed to update session', {
              error: error instanceof Error ? error.message : String(error),
            });
          } finally {
            setIsUpdatingSession(false);
          }
        }

        // Clean up localStorage immediately after successful verification
        if (result === 'success' || result === 'already-verified') {
          // Clean up immediately after session update completes
          setTimeout(() => {
            cleanupLocalStorage(verificationToken);
          }, 1000); // Short delay to ensure session update is complete
        }
      } catch (error) {
        logger.error('Verification error', {
          error: error instanceof Error ? error.message : String(error),
        });
        setVerificationStatus('error');
        localStorage.setItem(`${tokenKey}_result`, 'error');

        // Clean up after error as well (after a delay to allow retry)
        setTimeout(() => {
          cleanupLocalStorage(verificationToken);
        }, 30000); // Clean up error entries after 30 seconds
      } finally {
        setIsProcessing(false);
      }
    };

    processVerification();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verificationToken, status]); // Intentionally omit verifyEmail and update to prevent re-triggers

  if (status === 'loading') {
    return (
      <div className="container flex h-screen w-screen flex-col items-center justify-center">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px]">
          <Card>
            <CardHeader>
              <CardTitle>Loading...</CardTitle>
              <CardDescription>
                Please wait while we process your email verification.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  if (!verificationToken) {
    return (
      <div className="container flex h-screen w-screen flex-col items-center justify-center">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px]">
          <Card>
            <CardHeader>
              <CardTitle>Invalid Verification Link</CardTitle>
              <CardDescription>
                This verification link appears to be invalid or malformed.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => router.push('/')} className="w-full">
                Go to Home
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Email Verification</h1>
          <p className="text-sm text-muted-foreground">
            We&apos;re completing your email verification
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {verificationStatus === 'pending' && 'Verifying your email...'}
              {verificationStatus === 'success' &&
                (isUpdatingSession ? 'Updating your account...' : 'Email Verified!')}
              {verificationStatus === 'error' && 'Verification Failed'}
              {verificationStatus === 'already-verified' &&
                (isUpdatingSession ? 'Updating your account...' : 'Already Verified')}
            </CardTitle>
            <CardDescription>
              {verificationStatus === 'pending' &&
                'Please wait while we verify your email address.'}
              {verificationStatus === 'success' &&
                (isUpdatingSession
                  ? 'Please wait while we update your account settings.'
                  : 'Your email has been successfully verified.')}
              {verificationStatus === 'error' && 'There was an error verifying your email.'}
              {verificationStatus === 'already-verified' &&
                (isUpdatingSession
                  ? 'Please wait while we update your account settings.'
                  : 'Your email address has already been verified.')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {(verificationStatus === 'pending' || isUpdatingSession) && (
              <div className="flex items-center justify-center py-4">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              </div>
            )}

            {verificationStatus === 'error' && (
              <Alert variant="destructive">
                <AlertDescription>
                  The verification link may have expired or been used already. Please try requesting
                  a new verification email.
                </AlertDescription>
              </Alert>
            )}

            {(verificationStatus === 'success' || verificationStatus === 'already-verified') &&
              !isUpdatingSession && (
                <>
                  {status === 'authenticated' ? (
                    <Button onClick={() => router.push('/')} className="w-full">
                      Continue to Application
                    </Button>
                  ) : (
                    <Button
                      onClick={() => router.push('/login?message=email-verified-please-login')}
                      className="w-full"
                    >
                      Sign In to Continue
                    </Button>
                  )}
                </>
              )}

            {verificationStatus === 'error' && (
              <div className="flex flex-col gap-2">
                <Button onClick={() => router.push('/login')} className="w-full">
                  Go to Login
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.location.reload()}
                  className="w-full"
                >
                  Try Again
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function VerifyEmailCompletePage() {
  return (
    <Suspense
      fallback={
        <div className="container flex h-screen w-screen flex-col items-center justify-center">
          <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px]">
            <Card>
              <CardHeader>
                <CardTitle>Loading...</CardTitle>
                <CardDescription>Please wait while we load the verification page.</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      }
    >
      <VerifyEmailCompleteContent />
    </Suspense>
  );
}
