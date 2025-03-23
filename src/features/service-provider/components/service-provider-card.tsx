'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { ServiceProvider } from '@prisma/client';
import { CalendarIcon } from 'lucide-react';

import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';

interface ServiceProviderCardProps {
  serviceProvider: ServiceProvider & {
    serviceProviderType: { name: string } | null;
  };
}

export function ServiceProviderCard({ serviceProvider }: ServiceProviderCardProps) {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);

  const navigateToBooking = () => {
    setIsNavigating(true);
    router.push(`/calendar/service-provider/${serviceProvider.id}`);
  };

  useEffect(() => {
    // Prefetch the calendar page when the card is rendered
    router.prefetch(`/calendar/service-provider/${serviceProvider.id}`);
  }, [router, serviceProvider.id]);

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <CardHeader className="p-0">
        {serviceProvider.image ? (
          <div className="relative h-48 w-full">
            <Image
              src={serviceProvider.image}
              alt={`${serviceProvider.name}'s image`}
              fill
              className="object-cover"
            />
          </div>
        ) : (
          <div className="h-24 w-full bg-muted" />
        )}
      </CardHeader>
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 border-2 border-white shadow-sm">
            <div className="flex h-full w-full items-center justify-center bg-primary/10 text-xl font-semibold text-primary">
              {serviceProvider.name.charAt(0)}
            </div>
          </Avatar>
          <div>
            <h3 className="text-xl font-semibold">{serviceProvider.name}</h3>
            {serviceProvider.serviceProviderType && (
              <p className="text-muted-foreground">{serviceProvider.serviceProviderType.name}</p>
            )}
          </div>
        </div>

        <div className="mt-4">
          {serviceProvider.bio && (
            <p className="line-clamp-3 text-muted-foreground">{serviceProvider.bio}</p>
          )}
        </div>
      </CardContent>
      <CardFooter className="bg-muted/10 p-4">
        <Button
          onClick={navigateToBooking}
          className="w-full"
          variant="default"
          disabled={isNavigating}
        >
          {isNavigating ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-b-transparent"></div>
              Loading...
            </>
          ) : (
            <>
              <CalendarIcon className="mr-2 h-4 w-4" />
              Book Appointment
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
