'use client';

import Link from 'next/link';

import QueryLoader from '@/components/query-loader';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useOrganizationByUserId } from '@/features/organizations/hooks/use-organization-by-user-id';
import { UserProfile } from '@/features/profile/types/types';
import { SerializedServiceProvider } from '@/features/providers/types/types';

import { DeleteAccountButton } from './delete-account-button';

interface ProfileClientProps {
  profile: UserProfile;
  provider?: SerializedServiceProvider | null;
  isProfileLoading: boolean;
  profileError: Error | null;
  hasServiceProvider: boolean;
}

export function ProfileClient({
  profile,
  provider,
  isProfileLoading,
  profileError,
  hasServiceProvider,
}: ProfileClientProps) {
  const {
    data: organizations,
    isLoading: isOrganizationsLoading,
    error: organizationsError,
  } = useOrganizationByUserId(profile.id);

  return (
    <QueryLoader
      isLoading={isProfileLoading}
      message="Loading Profile"
      submessage="Retrieving your profile information..."
    >
      {profileError || !profile ? (
        <Card className="mx-auto max-w-4xl border-border bg-card dark:border-border dark:bg-card">
          <CardContent className="pt-6 text-center">
            <p className="text-destructive">
              {profileError instanceof Error ? profileError.message : 'Failed to load profile'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card className="mx-auto max-w-4xl border-border bg-card dark:border-border dark:bg-card">
            <CardHeader className="pb-3"></CardHeader>
            <CardContent>
              <div className="flex flex-col items-center space-y-4">
                {/* Personal Profile Section */}
                <Card className="w-full border-border bg-card dark:border-border dark:bg-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-foreground dark:text-foreground">
                      Personal Profile
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center space-y-4">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={profile.image ?? undefined} />
                      <AvatarFallback className="text-lg">
                        {profile.name?.[0] ?? '?'}
                      </AvatarFallback>
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

                      <DeleteAccountButton hasServiceProvider={hasServiceProvider} />
                    </div>
                  </CardContent>
                </Card>

                {/* Service Provider Section */}
                <Card className="w-full border-border bg-card dark:border-border dark:bg-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-foreground dark:text-foreground">
                      Service Provider
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center space-y-4">
                    <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                      Provider Status: {provider?.status ?? 'Not Registered'}
                    </p>
                    {provider?.serviceProviderType?.name && (
                      <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                        Type: {provider.serviceProviderType.name}
                      </p>
                    )}
                    <div>
                      {hasServiceProvider ? (
                        <Link href={`/providers/${provider?.id}`} passHref>
                          <Button variant="outline">Provider View</Button>
                        </Link>
                      ) : (
                        <Link href="/providers/new" passHref>
                          <Button variant="outline">Register Provider</Button>
                        </Link>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Organizations Section */}
                <Card className="w-full border-border bg-card dark:border-border dark:bg-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-foreground dark:text-foreground">
                      Organizations
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center space-y-4">
                    {isOrganizationsLoading ? (
                      <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                        Loading organizations...
                      </p>
                    ) : organizationsError ? (
                      <p className="text-sm text-destructive dark:text-destructive">
                        Error loading organizations: {organizationsError.message}
                      </p>
                    ) : organizations && organizations.length > 0 ? (
                      <div className="w-full space-y-4">
                        {organizations.map((org: any) => (
                          <div key={org.id} className="space-y-2 text-center">
                            <p className="text-lg font-semibold">{org.name}</p>
                            <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                              Status: {org.status}
                            </p>
                            <Link href={`/organizations/${org.id}`} passHref>
                              <Button variant="outline">View Organization</Button>
                            </Link>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <>
                        <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                          Organization Status: Not Registered
                        </p>
                        <div>
                          <Link href="/organizations/new" passHref>
                            <Button variant="outline">Register Organization</Button>
                          </Link>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </QueryLoader>
  );
}
