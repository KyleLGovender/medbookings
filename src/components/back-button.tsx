'use client';

import { ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface BackButtonProps {
  children?: React.ReactNode;
  className?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showIcon?: boolean;
}

export function BackButton({ 
  children = 'Go Back',
  className,
  variant = 'default',
  size = 'default',
  showIcon = true,
  ...props
}: BackButtonProps) {
  return (
    <Button 
      variant={variant} 
      size={size}
      className={cn('', className)}
      onClick={() => window.history.back()}
      {...props}
    >
      {showIcon && <ArrowLeft className="mr-2 h-4 w-4" />}
      {children}
    </Button>
  );
}
