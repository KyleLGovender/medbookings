import Link from 'next/link';

import { getServerSession } from 'next-auth';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ServiceProviderProfile } from '@/features/service-provider/components/service-provider';
import { getServiceProviderByUserId } from '@/features/service-provider/lib/queries';
import { authOptions } from '@/lib/auth';

import { DeleteAccountButton } from './delete-account-button';

export default async function Profile() {
  const session = await getServerSession(authOptions);

  const serviceProvider = session?.user?.id
    ? await getServiceProviderByUserId(session.user.id)
    : null;

  return (
    <>
      <Card className="mx-auto mt-4 max-w-lg">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center space-y-3">
            <Avatar>
              <AvatarImage src={session?.user?.image ?? undefined} />
              <AvatarFallback>{session?.user?.name?.[0] ?? '?'}</AvatarFallback>
            </Avatar>
            <div className="space-y-1 text-center">
              <h4 className="text-sm font-semibold">{session?.user?.name ?? ''}</h4>
              <p className="text-sm text-muted-foreground">{session?.user?.email ?? ''}</p>
            </div>
            <div className="flex w-full justify-center pt-4">
              <DeleteAccountButton hasServiceProvider={!!serviceProvider} />
            </div>
          </div>
        </CardContent>
      </Card>
      {serviceProvider ? (
        <ServiceProviderProfile serviceProvider={serviceProvider} />
      ) : (
        <Card className="mx-auto mt-4 max-w-lg">
          <CardContent className="pt-6 text-center">
            <div className="mx-auto mt-4 max-w-md text-center">
              <Link
                href="/profile/service-provider/register"
                className={buttonVariants({ className: 'mt-2 w-full' })}
              >
                Register as a Service Provider
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
