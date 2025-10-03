import { useCallback } from 'react';

import { useToast } from '@/hooks/use-toast';
import { completeEmailVerification } from '@/lib/actions/email-verification';
import { logger } from '@/lib/logger';

export function useEmailVerification() {
  const { toast } = useToast();

  const verifyEmail = useCallback(
    async (token: string): Promise<'success' | 'error' | 'already-verified'> => {
      try {
        const result = await completeEmailVerification(token);

        if (!result.success) {
          toast({
            title: 'Verification failed',
            description: result.error || 'Failed to complete email verification',
            variant: 'destructive',
          });
          return 'error';
        }

        if (result.alreadyVerified) {
          toast({
            title: 'Email already verified',
            description: 'Your email address has already been verified.',
          });
          return 'already-verified';
        } else {
          toast({
            title: 'Email verified!',
            description: 'Your email address has been successfully verified.',
          });
          return 'success';
        }
      } catch (error) {
        logger.error('Verification completion error', {
          error: error instanceof Error ? error.message : String(error),
        });
        toast({
          title: 'Verification failed',
          description: 'An unexpected error occurred during verification',
          variant: 'destructive',
        });
        return 'error';
      }
    },
    [toast]
  );

  return { verifyEmail };
}
