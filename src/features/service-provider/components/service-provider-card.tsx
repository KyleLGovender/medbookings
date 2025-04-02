'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { CalendarIcon, UserRound } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';

import { ServiceProvider } from '../lib/types';

interface ServiceProviderCardProps {
  serviceProvider: ServiceProvider;
  className?: string;
}

export function ServiceProviderCard({ serviceProvider, className }: ServiceProviderCardProps) {
  const [isNavigatingProfile, setIsNavigatingProfile] = useState(false);
  const [isNavigatingCalendar, setIsNavigatingCalendar] = useState(false);

  // This effect will run when the component is about to unmount
  // which happens during navigation
  useEffect(() => {
    return () => {
      // Clean up any resources if needed
    };
  }, []);

  return (
    <Card
      className={`flex h-full flex-col overflow-hidden transition-all hover:shadow-md ${className || ''}`}
    >
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
      <CardContent className="flex-grow p-6">
        <div className="flex items-center gap-4">
          {/* <Avatar className="h-16 w-16 border-2 border-white shadow-sm">
            <div className="flex h-full w-full items-center justify-center bg-primary/10 text-xl font-semibold text-primary">
              {serviceProvider.name.charAt(0)}
            </div>
          </Avatar> */}
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
      <CardFooter className="flex flex-col gap-3 bg-muted/10 p-6">
        <Link
          href={`/service-providers/${serviceProvider.id}`}
          onClick={() => setIsNavigatingProfile(true)}
          className="w-full"
        >
          <Button className="w-full" variant="default" disabled={isNavigatingProfile}>
            {isNavigatingProfile ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                Loading...
              </>
            ) : (
              <>
                <UserRound className="mr-2 h-4 w-4" />
                View Profile
              </>
            )}
          </Button>
        </Link>
        <Link
          href={`/calendar/service-provider/${serviceProvider.id}`}
          onClick={() => setIsNavigatingCalendar(true)}
          className="w-full"
        >
          <Button className="w-full" variant="default" disabled={isNavigatingCalendar}>
            {isNavigatingCalendar ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                Loading...
              </>
            ) : (
              <>
                <CalendarIcon className="mr-2 h-4 w-4" />
                Book Appointment
              </>
            )}
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
