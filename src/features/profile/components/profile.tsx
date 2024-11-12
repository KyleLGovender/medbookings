import Link from 'next/link';

import { Button, Card, CardBody, User } from '@nextui-org/react';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export default async function Profile() {
  const session = await getServerSession(authOptions);
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
        <Link href="/profile/service-provider" className="w-full">
          <Button className="w-full">Register as a Service Provider</Button>
        </Link>
      </Card>
    </>
  );
}
