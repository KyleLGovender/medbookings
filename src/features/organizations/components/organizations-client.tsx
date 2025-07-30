'use client';

import { useQuery } from '@tanstack/react-query';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NavigationOutlineButton } from '@/components/ui/navigation-button';

interface Organization {
  id: string;
  name: string;
  status: string;
}

async function fetchOrganizationsByUserId(userId: string): Promise<Organization[]> {
  const res = await fetch(`/api/organizations/user/${userId}`);
  if (!res.ok) {
    throw new Error('Failed to fetch organizations');
  }
  return res.json();
}

interface OrganizationsClientProps {
  userId: string;
}

export default function OrganizationsClient({ userId }: OrganizationsClientProps) {
  const {
    data: organizations,
    isLoading,
    error,
  } = useQuery<Organization[]>({
    queryKey: ['organizations', userId],
    queryFn: () => fetchOrganizationsByUserId(userId),
  });

  if (isLoading) {
    return <p>Loading organizations...</p>;
  }

  if (error) {
    return <p>Error loading organizations: {error.message}</p>;
  }

  if (!organizations || organizations.length === 0) {
    return (
      <div className="space-y-6">
        <Card className="w-full border-border bg-card dark:border-border dark:bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-foreground dark:text-foreground">
              Your Organizations
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-4">
            <p className="text-sm text-muted-foreground dark:text-muted-foreground">
              You are not registered with any organizations.
            </p>
            <div>
              <NavigationOutlineButton href="/organizations/new">
                Register New Organization
              </NavigationOutlineButton>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="w-full border-border bg-card dark:border-border dark:bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-foreground dark:text-foreground">
            Your Organizations
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-4">
          <div className="w-full space-y-4">
            {organizations.map((org) => (
              <div key={org.id} className="space-y-2 text-center">
                <h3 className="text-lg font-semibold">{org.name}</h3>
                <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                  Status: {org.status}
                </p>
                <NavigationOutlineButton href={`/organizations/${org.id}`}>
                  View Details
                </NavigationOutlineButton>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
