'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface ApprovalButtonsProps {
  onApprove: () => Promise<void>;
  onReject: () => void;
  isApproving?: boolean;
  isRejecting?: boolean;
  disabled?: boolean;
  approveText?: string;
  rejectText?: string;
  size?: 'sm' | 'default' | 'lg';
  showSuccessToast?: boolean;
}

export function ApprovalButtons({
  onApprove,
  onReject,
  isApproving = false,
  isRejecting = false,
  disabled = false,
  approveText = 'Approve',
  rejectText = 'Reject',
  size = 'default',
  showSuccessToast = true,
}: ApprovalButtonsProps) {
  const { toast } = useToast();
  const [localApproving, setLocalApproving] = useState(false);

  const handleApprove = async () => {
    if (localApproving || isApproving || isRejecting) return;

    try {
      setLocalApproving(true);
      await onApprove();
      if (showSuccessToast) {
        toast({
          title: 'Success',
          description: 'Approved successfully',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to approve. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLocalApproving(false);
    }
  };

  const isProcessing = localApproving || isApproving || isRejecting;

  return (
    <div className="flex gap-2">
      <Button
        onClick={handleApprove}
        disabled={disabled || isProcessing}
        size={size}
        className="bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
      >
        {localApproving || isApproving ? 'Approving...' : approveText}
      </Button>
      <Button
        onClick={onReject}
        disabled={disabled || isProcessing}
        variant="destructive"
        size={size}
        className="disabled:opacity-50"
      >
        {isRejecting ? 'Rejecting...' : rejectText}
      </Button>
    </div>
  );
}
