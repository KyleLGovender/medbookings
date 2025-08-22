'use client';

import { useRouter } from 'next/navigation';
import React, { useMemo } from 'react';

import { useSession } from 'next-auth/react';

import { AvailabilityModal } from '@/features/calendar/components/modal/availability-modal';
import { ProviderCalendarView } from '@/features/calendar/components/provider-calendar-view';
import {
  useAcceptAvailabilityProposal,
  useDeleteAvailability,
  useRejectAvailabilityProposal,
} from '@/features/calendar/hooks/use-availability';
import { useAvailabilityModal } from '@/features/calendar/hooks/use-availability-modal';
import { getProviderCalendarPermissions } from '@/features/calendar/lib/permissions';
import type { SeriesActionScope } from '@/features/calendar/types/modal';
import { useCurrentUserProvider } from '@/features/providers/hooks/use-current-user-provider';
import { useToast } from '@/hooks/use-toast';

interface ProviderCalendarPageProps {
  params: {
    id: string;
  };
}

export default function ProviderCalendarPage({ params }: ProviderCalendarPageProps) {
  const router = useRouter();
  const { toast } = useToast();

  // Data fetching
  const { data: session } = useSession();
  const currentUser = session?.user;
  const { data: currentUserProvider } = useCurrentUserProvider();

  // Mutations
  const deleteMutation = useDeleteAvailability({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Availability deleted successfully',
      });
    },
  });

  const acceptMutation = useAcceptAvailabilityProposal({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Availability proposal accepted',
      });
    },
  });

  const rejectMutation = useRejectAvailabilityProposal({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Availability proposal rejected',
      });
    },
  });

  // Availability modal
  const modal = useAvailabilityModal({
    onEdit: (event, scope) => {
      // Navigate to edit page with scope parameter and return URL
      const searchParams = new URLSearchParams();
      // Only add scope parameter for recurring availability and non-single scopes
      if (event.isRecurring && scope !== 'single') {
        searchParams.set('scope', scope);
      }
      searchParams.set('returnUrl', `/providers/${params.id}/manage-calendar`);
      router.push(`/availability/${event.id}/edit?${searchParams.toString()}`);
    },
    onDelete: (event, scope) => {
      // Only pass scope for recurring availability
      const deleteParams = event.isRecurring ? { ids: [event.id], scope } : { ids: [event.id] };
      deleteMutation.mutate(deleteParams);
    },
    onAccept: (event) => {
      acceptMutation.mutate({ id: event.id });
    },
    onReject: (event, reason) => {
      rejectMutation.mutate({ id: event.id, reason });
    },
  });

  // Compute permissions based on current context
  const permissions = useMemo(
    () =>
      getProviderCalendarPermissions(modal.selectedEvent, currentUser || null, currentUserProvider),
    [modal.selectedEvent, currentUser, currentUserProvider]
  );

  // Event handlers
  const handleCreateAvailability = () => {
    // Navigate to create page with provider ID and return URL
    const searchParams = new URLSearchParams();
    searchParams.set('providerId', params.id);
    searchParams.set('returnUrl', `/providers/${params.id}/manage-calendar`);
    router.push(`/availability/create?${searchParams.toString()}`);
  };

  return (
    <>
      {/* Main Calendar View */}
      <ProviderCalendarView
        providerId={params.id}
        onCreateAvailability={handleCreateAvailability}
        onAvailabilityClick={(availability) => modal.openEvent(availability)}
      />

      {/* Availability Modal - for actions like delete, accept, reject */}
      <AvailabilityModal
        isOpen={modal.isOpen}
        event={modal.selectedEvent}
        permissions={permissions}
        onEdit={modal.handleEdit}
        onDelete={modal.handleDelete}
        onAccept={modal.handleAccept}
        onReject={modal.handleReject}
        onClose={modal.close}
      />
    </>
  );
}
