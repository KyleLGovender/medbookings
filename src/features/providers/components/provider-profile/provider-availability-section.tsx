'use client';

import Link from 'next/link';

import { Calendar, Clock } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/utils/api';

interface ProviderAvailabilitySectionProps {
  providerId: string;
}

export function ProviderAvailabilitySection({ providerId }: ProviderAvailabilitySectionProps) {
  const { data: availabilities, isLoading } = api.calendar.getProviderAvailabilities.useQuery({
    providerId,
    limit: 5,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Availability Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Availability Schedule
            </CardTitle>
            <CardDescription>Your upcoming available time slots</CardDescription>
          </div>
          <Link href={`/availability/create?providerId=${providerId}&returnUrl=/provider-profile`}>
            <Button size="sm" variant="outline">
              Add Availability
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {availabilities && availabilities.length > 0 ? (
          <div className="space-y-3">
            {availabilities.slice(0, 5).map((availability: any) => (
              <div
                key={availability.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">
                      {new Date(availability.startTime).toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(availability.startTime).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      {' - '}
                      {new Date(availability.endTime).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
                <div className="text-sm">
                  <span className="font-medium text-muted-foreground">{availability.status}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center">
            <p className="mb-4 text-sm text-muted-foreground">No availability slots created yet</p>
            <Link
              href={`/availability/create?providerId=${providerId}&returnUrl=/provider-profile`}
            >
              <Button variant="outline">Create Your First Availability</Button>
            </Link>
          </div>
        )}

        {availabilities && availabilities.length > 5 && (
          <div className="mt-4">
            <Link href="/availability">
              <Button variant="outline" className="w-full">
                View All Availabilities
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
