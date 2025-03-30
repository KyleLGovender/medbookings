import Image from 'next/image';
import Link from 'next/link';

import { AspectRatio } from '@/components/ui/aspect-ratio';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { ServiceProvider } from '../lib/types';

interface ServiceProviderProps {
  serviceProvider: ServiceProvider;
}

export function ServiceProviderProfile({ serviceProvider }: ServiceProviderProps) {
  return (
    <>
      <Card className="mx-auto mt-4 max-w-md">
        <CardContent className="pt-6 text-center">
          <div className="space-y-6">
            {serviceProvider.image && (
              <AspectRatio ratio={16 / 9} className="overflow-hidden rounded-md">
                <Image
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover"
                  alt="Service Provider Image"
                  src={serviceProvider.image}
                  priority
                />
              </AspectRatio>
            )}
            <Link
              href="/profile/service-provider/view"
              className={buttonVariants({ className: 'mt-2 w-full' })}
            >
              View Service Provider Profile
            </Link>
            <Link
              href="/profile/service-provider/edit"
              className={buttonVariants({ className: 'mt-2 w-full' })}
            >
              Edit Service Provider Profile
            </Link>
            <Link
              href="/profile/service-provider/calendar"
              className={buttonVariants({ className: 'w-full' })}
            >
              Manage Availability
            </Link>

            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle>{serviceProvider.serviceProviderType.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p>
                  <span className="font-semibold">Name:</span> {serviceProvider.name}
                </p>
                <p>
                  <span className="font-semibold">Email:</span> {serviceProvider.user.email}
                </p>
                {serviceProvider.bio && (
                  <p>
                    <span className="font-semibold">Bio:</span> {serviceProvider.bio}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Services */}
            <Card>
              <CardHeader>
                <CardTitle>Services Offered</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {serviceProvider.services.map((service) => (
                    <Card key={service.id}>
                      <CardHeader>
                        <CardTitle className="text-lg">{service.name}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">{service.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
