'use client';

import { Button } from '@/components/ui/button';

export function BackButton() {
  return (
    <Button variant="default" onClick={() => window.history.back()}>
      Go Back
    </Button>
  );
}
