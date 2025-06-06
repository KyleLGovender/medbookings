'use client';

import Link from 'next/link';

import QueryLoader from '@/components/query-loader';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useProfile } from '@/features/profile/hooks/use-profile';
import { ServiceProviderProfileClient } from '@/features/providers/components/service-provider-client';

import { DeleteAccountButton } from './delete-account-button';

export function ProfileClient() {
  const { data: profile, isLoading, error } = useProfile();

  return (
    <QueryLoader
      isLoading={isLoading}
      message="Loading Profile"
      submessage="Retrieving your profile information..."
    >
      {error || !profile ? (
        <Card className="mx-auto max-w-4xl border-border bg-card dark:border-border dark:bg-card">
          <CardContent className="pt-6 text-center">
            <p className="text-destructive">
              {error instanceof Error ? error.message : 'Failed to load profile'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card className="mx-auto max-w-4xl border-border bg-card dark:border-border dark:bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl text-foreground dark:text-foreground">
                Personal Profile
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center space-y-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={profile.image ?? undefined} />
                  <AvatarFallback className="text-lg">{profile.name?.[0] ?? '?'}</AvatarFallback>
                </Avatar>
                <div className="space-y-1 text-center">
                  <h2 className="text-xl font-semibold text-foreground dark:text-foreground">
                    {profile.name ?? 'User'}
                  </h2>
                  <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                    {profile.email ?? ''}
                  </p>
                  {profile.phone && (
                    <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                      Phone: {profile.phone}
                    </p>
                  )}
                  {profile.whatsapp && (
                    <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                      WhatsApp: {profile.whatsapp}
                    </p>
                  )}
                </div>
                <div className="flex w-full justify-center gap-3 pt-4">
                  <Link href="/profile/edit" passHref>
                    <Button variant="outline">Edit Profile</Button>
                  </Link>
                  <DeleteAccountButton hasServiceProvider={false} />
                </div>
              </div>
            </CardContent>
          </Card>

          <ServiceProviderProfileClient userId={profile.id} />
        </div>
      )}
    </QueryLoader>
  );
}
