import { FileSearch } from 'lucide-react';

import { BackButton } from '@/components/back-button';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function NotFound() {
  return (
    <div className="container flex min-h-[600px] items-center justify-center">
      <Card className="w-[380px]">
        <CardHeader>
          <div className="flex items-center justify-center">
            <FileSearch className="h-8 w-8 text-muted-foreground" />
          </div>
          <CardTitle className="text-center text-2xl font-semibold">Page Not Found</CardTitle>
          <CardDescription className="text-center">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex justify-center">
          <BackButton />
        </CardFooter>
      </Card>
    </div>
  );
}
