'use client';

import { useState } from 'react';

import { Edit2, Plus, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/utils/api';

interface ProviderServicesSectionProps {
  providerId: string;
  providerStatus?: string;
}

export function ProviderServicesSection({
  providerId,
  providerStatus,
}: ProviderServicesSectionProps) {
  const { data: services, isLoading } = api.providers.getProviderAllServices.useQuery({
    providerId,
  });
  const [isAddingService, setIsAddingService] = useState(false);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Services Offered</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
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
            <CardTitle>Services Offered</CardTitle>
            <CardDescription>Manage the services you provide to patients</CardDescription>
          </div>
          {providerStatus !== 'APPROVED' && (
            <Button size="sm" onClick={() => setIsAddingService(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Service
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {services && services.length > 0 ? (
          <div className="space-y-4">
            {services.map((service) => (
              <div
                key={service.id}
                className="flex items-start justify-between rounded-lg border p-4"
              >
                <div className="space-y-1">
                  <h4 className="font-medium">{service.name}</h4>
                  <p className="text-sm text-muted-foreground">{service.description}</p>
                  {service.defaultPrice && (
                    <p className="text-sm font-medium">
                      R{Number(service.defaultPrice)} • {service.defaultDuration} min
                    </p>
                  )}
                </div>
                {providerStatus !== 'APPROVED' && (
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center">
            <p className="mb-4 text-sm text-muted-foreground">No services added yet</p>
            {providerStatus !== 'APPROVED' && (
              <Button variant="outline" onClick={() => setIsAddingService(true)}>
                Add Your First Service
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
