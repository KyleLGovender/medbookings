import Link from 'next/link';

import { getServerSession } from 'next-auth';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ServiceProviderProfile } from '@/features/providers/components/service-provider';
import { getServiceProviderByUserId } from '@/features/providers/lib/queries';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

import { DeleteAccountButton } from './delete-account-button';

export default async function Profile() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return <div>You must be logged in to view this page.</div>;
  }

  // Fetch the complete user data from the database
  const userData = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      phone: true,
      whatsapp: true,
    },
  });

  const serviceProvider = await getServiceProviderByUserId(session.user.id);

  return (
    <div className="space-y-6">
      <Card className="mx-auto max-w-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl">Personal Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center space-y-4">
            <Avatar className="h-24 w-24">
              <AvatarImage src={userData?.image ?? undefined} />
              <AvatarFallback className="text-lg">{userData?.name?.[0] ?? '?'}</AvatarFallback>
            </Avatar>
            <div className="space-y-1 text-center">
              <h2 className="text-xl font-semibold">{userData?.name ?? 'User'}</h2>
              <p className="text-sm text-muted-foreground">{userData?.email ?? ''}</p>
              {userData?.phone && (
                <p className="text-sm text-muted-foreground">Phone: {userData.phone}</p>
              )}
              {userData?.whatsapp && (
                <p className="text-sm text-muted-foreground">WhatsApp: {userData.whatsapp}</p>
              )}
            </div>
            <div className="flex w-full justify-center gap-3 pt-4">
              <Link href="/profile/edit" passHref>
                <Button variant="outline">Edit Profile</Button>
              </Link>
              <DeleteAccountButton hasServiceProvider={!!serviceProvider} />
            </div>
          </div>
        </CardContent>
      </Card>

      {serviceProvider ? (
        <ServiceProviderProfile serviceProvider={serviceProvider} />
      ) : (
        <Card className="mx-auto max-w-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl">Service Provider</CardTitle>
          </CardHeader>
          <CardContent className="pt-2 text-center">
            <p className="mb-4 text-muted-foreground">
              Register as a service provider to offer your services on our platform.
            </p>
            <Link
              href="/profile/service-provider/register"
              className={buttonVariants({ className: 'mt-2 w-full' })}
            >
              Register as a Service Provider
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
