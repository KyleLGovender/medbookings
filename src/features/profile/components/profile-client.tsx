'use client';

import { useRouter } from 'next/navigation';

import { StatusBadge } from '@/components/status-badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useOrganizationByUserId } from '@/features/organizations/hooks/use-organization-by-user-id';
import { UserProfile } from '@/features/profile/types/types';
import { SerializedServiceProvider } from '@/features/providers/hooks/types';

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

  const router = useRouter();

  return (
    <div className="space-y-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Manage your profile details</p>
        </div>
      </div>
      <Card className="mx-auto border-border bg-card dark:border-border dark:bg-card">
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
                  <Button variant="outline" onClick={() => router.push('/profile/edit')}>
                    Edit Profile
                  </Button>

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
                {provider?.serviceProviderType?.name && (
                  <p className="text-lg font-semibold">{provider.serviceProviderType.name}</p>
                )}
                <p className="text-sm text-muted-foreground">
                  {provider?.status ? (
                    <StatusBadge
                      status={provider.status as 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED'}
                    />
                  ) : (
                    'Not Registered'
                  )}
                </p>
                <div>
                  {hasServiceProvider ? (
                    <Button
                      variant="outline"
                      onClick={() => router.push(`/providers/${provider?.id}`)}
                    >
                      Provider View
                    </Button>
                  ) : (
                    <Button variant="outline" onClick={() => router.push('/providers/new')}>
                      Register Provider
                    </Button>
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
                <div className="flex justify-center">
                  <Button variant="outline" onClick={() => router.push('/organizations/new')}>
                    Add Another Organization
                  </Button>
                </div>
                <div className="flex flex-col items-center space-y-4">
                  {organizations && organizations.length > 0 ? (
                    <p>
                      {organizations.map((org: any) => (
                        <div key={org.id}>
                          <p className="text-sm text-muted-foreground">{org.name}</p>
                          {org?.status ? (
                            <StatusBadge
                              status={
                                org.status as 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED'
                              }
                            />
                          ) : (
                            <p className="text-sm text-muted-foreground">Not Registered</p>
                          )}
                          <Button
                            variant="outline"
                            onClick={() => router.push(`/organizations/${org.id}`)}
                          >
                            View Organization
                          </Button>
                        </div>
                      ))}
                    </p>
                  ) : (
                    <>
                      <p className="text-sm text-muted-foreground">Not Registered</p>
                      <Button variant="outline" onClick={() => router.push('/organizations/new')}>
                        Register Organization
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
