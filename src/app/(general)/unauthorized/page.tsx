import Link from 'next/link';

import { Mail, Shield } from 'lucide-react';

import { BackButton } from '@/components/back-button';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container mx-auto px-4 py-16">
        <div className="flex min-h-[70vh] items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                <Shield className="h-8 w-8 text-destructive" />
              </div>
              <CardTitle className="text-2xl font-bold">Access Denied</CardTitle>
              <CardDescription className="text-base">
                You don't have the required permissions to access this page.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-muted/50 p-4">
                <h3 className="mb-2 font-semibold">What happened?</h3>
                <p className="text-sm text-muted-foreground">
                  This page requires administrative privileges that your account doesn't currently
                  have.
                </p>
              </div>

              <div className="space-y-2">
                <BackButton className="w-full">Back</BackButton>

                <Button variant="outline" asChild className="w-full">
                  <Link href="/">Go to Home</Link>
                </Button>
              </div>

              <div className="border-t pt-4 text-center">
                <p className="mb-3 text-sm text-muted-foreground">Need admin access?</p>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="mailto:support@medbookings.com">
                    <Mail className="mr-2 h-4 w-4" />
                    Contact Support
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
