import { notFound } from 'next/navigation';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface OrganizationDetailsPageProps {
  params: { id: string };
}

async function getOrganizationDetails(organizationId: string) {
  const res = await fetch(`http://localhost:3000/api/organizations/${organizationId}`);
  if (!res.ok) {
    return null;
  }
  return res.json();
}

export default async function OrganizationDetailsPage({ params }: OrganizationDetailsPageProps) {
  const organization = await getOrganizationDetails(params.id);

  if (!organization) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <Card className="w-full border-border bg-card dark:border-border dark:bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-foreground dark:text-foreground">
            Organization Details
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-4">
          <h2 className="text-xl font-semibold text-foreground dark:text-foreground">
            {organization.name}
          </h2>
          <p className="text-sm text-muted-foreground dark:text-muted-foreground">
            Status: {organization.status}
          </p>
          {/* Add more organization details here as needed */}
        </CardContent>
      </Card>
    </div>
  );
}
