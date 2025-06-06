import Link from 'next/link';
import { notFound } from 'next/navigation';

import { PenSquare } from 'lucide-react';
import { getServerSession } from 'next-auth';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getServiceProviderByServiceProviderId } from '@/features/providers/lib/queries';
import { authOptions } from '@/lib/auth';

interface ServiceProviderPageProps {
  params: {
    id: string;
  };
}

export default async function ServiceProviderPage({ params }: ServiceProviderPageProps) {
  const provider = await getServiceProviderByServiceProviderId(params.id);

  if (!provider) {
    notFound();
  }

  // Get current session to check if user can edit this profile
  const session = await getServerSession(authOptions);
  const isOwner = session?.user?.id === provider.userId;

  // For provider type, use a generic label since we don't have the actual type name
  const providerTypeName = 'Healthcare Provider';

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{provider.name}</h1>
          <p className="mt-2 text-muted-foreground">{providerTypeName}</p>
        </div>

        {isOwner && (
          <Link href={`/service-provider/${provider.id}/edit`}>
            <Button variant="outline" className="flex items-center gap-2">
              <PenSquare className="h-4 w-4" />
              Edit Profile
            </Button>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {provider.image && (
                <div className="flex justify-center">
                  <img
                    src={provider.image}
                    alt={provider.name}
                    className="h-40 w-40 rounded-full object-cover"
                  />
                </div>
              )}

              <div>
                <h3 className="font-medium">Email</h3>
                <p>{provider.email}</p>
              </div>

              <div>
                <h3 className="font-medium">WhatsApp</h3>
                <p>{provider.whatsapp}</p>
              </div>

              {provider.website && (
                <div>
                  <h3 className="font-medium">Website</h3>
                  <a
                    href={provider.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {provider.website}
                  </a>
                </div>
              )}

              <div>
                <h3 className="font-medium">Languages</h3>
                <div className="flex flex-wrap gap-1">
                  {provider.languages.map((language: string) => (
                    <span key={language} className="rounded-full bg-muted px-2 py-1 text-xs">
                      {language}
                    </span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>About</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-line">{provider.bio}</p>
            </CardContent>
          </Card>

          {/* Additional sections like services, ratings, etc. can be added here */}
        </div>
      </div>
    </>
  );
}
