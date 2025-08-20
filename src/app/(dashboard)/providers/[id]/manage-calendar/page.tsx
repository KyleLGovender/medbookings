'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';

import { CalendarEventModal } from '@/features/calendar/components/modal/calendar-event-modal';
import { ProviderCalendarView } from '@/features/calendar/components/provider-calendar-view';
import {
  useAcceptAvailabilityProposal,
  useDeleteAvailability,
  useRejectAvailabilityProposal,
} from '@/features/calendar/hooks/use-availability';
import { useCalendarEventModal } from '@/features/calendar/hooks/use-calendar-event-modal';
import { getProviderCalendarPermissions } from '@/features/calendar/lib/permissions';
import { useCurrentUserProvider } from '@/features/providers/hooks/use-current-user-provider';
import { useToast } from '@/hooks/use-toast';
import { useSession } from 'next-auth/react';
import type { SeriesActionScope } from '@/features/calendar/types/modal';

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

  // Calendar event modal
  const modal = useCalendarEventModal({
    onEdit: (event, scope) => {
      // Navigate to edit page with scope parameter and return URL
      const searchParams = new URLSearchParams();
      if (scope !== 'single') {
        searchParams.set('scope', scope);
      }
      searchParams.set('returnUrl', `/providers/${params.id}/manage-calendar`);
      router.push(`/availability/${event.id}/edit?${searchParams.toString()}`);
    },
    onDelete: (event, scope) => {
      deleteMutation.mutate({ ids: [event.id], scope });
    },
    onAccept: (event) => {
      acceptMutation.mutate({ id: event.id });
    },
    onReject: (event, reason) => {
      rejectMutation.mutate({ id: event.id, reason });
    },
  });

  // Compute permissions based on current context
  const permissions = useMemo(() => 
    getProviderCalendarPermissions(modal.state.selectedEvent, currentUser || null, currentUserProvider),
    [modal.state.selectedEvent, currentUser, currentUserProvider]
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
        onEventClick={(event) => modal.actions.openEvent(event)}
      />

      {/* Calendar Event Modal - for actions like delete, accept, reject */}
      <CalendarEventModal
        state={modal.state}
        permissions={permissions}
        onSelectScope={modal.actions.selectScope}
        onSetPendingAction={modal.actions.setPendingAction}
        onSetActionData={modal.actions.setActionData}
        onExecuteAction={modal.actions.executeAction}
        onClose={modal.actions.close}
      />
    </>
  );
}