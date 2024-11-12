import Link from 'next/link';

import { Button, Card, CardBody, User } from '@nextui-org/react';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getServiceProvider } from '../service-provider/lib/queries';

export default async function Profile() {
  const session = await getServerSession(authOptions);
  const serviceProvider = session?.user?.id 
    ? await getServiceProvider(session.user.id)
    : null;

  return (
    <>
      <Card className="mx-auto mt-4 max-w-md">
        <CardBody className="text-center">
          <User
            name={session?.user?.name ?? ''}
            description={session?.user?.email ?? ''}
            avatarProps={{
              showFallback: !session?.user?.image,
              src: session?.user?.image ?? undefined,
            }}
          />
        </CardBody>
      </Card>
      <Card className="mx-auto mt-4 max-w-md">
        <Link 
          href={serviceProvider 
            ? "/profile/service-provider" 
            : "/profile/service-provider/registration"} 
          className="w-full"
        >
          <Button className="w-full">
            {serviceProvider 
              ? "View Service Provider Profile" 
              : "Register as a Service Provider"}
          </Button>
        </Link>
      </Card>
    </>
  );
}
