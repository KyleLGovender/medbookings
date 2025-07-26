'use client';

import { useRouter } from 'next/navigation';
import { ButtonHTMLAttributes } from 'react';

import { Button, ButtonProps } from '@/components/ui/button';

interface CancelButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    Pick<ButtonProps, 'variant' | 'size'> {
  /**
   * The path to navigate to when the button is clicked
   * If not provided, will use router.back() instead
   */
  cancelTo?: string;
  /**
   * The text to display on the button
   * @default "Cancel"
   */
  children?: React.ReactNode;
}

/**
 * A button component that cancels the current action and navigates to a specified path or the previous page
 */
export function CancelButton({
  cancelTo,
  variant = 'outline',
  children = 'Cancel',
  ...props
}: CancelButtonProps) {
  const router = useRouter();

  const handleCancel = () => {
    if (cancelTo) {
      router.push(cancelTo);
    } else {
      router.back();
    }
  };

  return (
    <Button variant={variant} onClick={handleCancel} {...props}>
      {children}
    </Button>
  );
}
