'use client';

import { MapPin, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface EditOrganizationLocationsProps {
  organizationId: string;
  userId?: string;
}

export function EditOrganizationLocations({
  organizationId,
  userId,
}: EditOrganizationLocationsProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Locations</h2>
        <p className="text-sm text-muted-foreground">
          Manage the physical locations associated with your organization.
        </p>
      </div>
      <Separator />

      <div className="space-y-4">
        {/* TODO: Implement location management */}
        <div className="py-8 text-center">
          <MapPin className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">Location Management</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Location editing functionality will be implemented in a future update.
          </p>
          <Button className="mt-4" variant="outline" disabled>
            <Plus className="mr-2 h-4 w-4" />
            Add Location
          </Button>
        </div>
      </div>
    </div>
  );
}
