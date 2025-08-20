'use client';

import React, { useMemo } from 'react';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AvailabilityCreationForm } from '@/features/calendar/components/availability/availability-creation-form';
import { AvailabilityEditForm } from '@/features/calendar/components/availability/availability-edit-form';
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

  // Edit form state
  const [showEditForm, setShowEditForm] = React.useState(false);
  const [editFormScope, setEditFormScope] = React.useState<SeriesActionScope>('single');
  const [showCreateForm, setShowCreateForm] = React.useState(false);

  // Calendar event modal
  const modal = useCalendarEventModal({
    onEdit: (_event, scope) => {
      setEditFormScope(scope);
      setShowEditForm(true);
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
    setShowCreateForm(true);
  };

  const handleCreateSuccess = () => {
    setShowCreateForm(false);
  };

  const handleCreateCancel = () => {
    setShowCreateForm(false);
  };

  const handleEditSuccess = () => {
    setShowEditForm(false);
  };

  const handleEditCancel = () => {
    setShowEditForm(false);
  };

  return (
    <>
      {/* Main Calendar View */}
      <ProviderCalendarView
        providerId={params.id}
        onCreateAvailability={handleCreateAvailability}
        onEventClick={(event) => modal.actions.openEvent(event)}
      />

      {/* New Modal System */}
      <CalendarEventModal
        state={modal.state}
        permissions={permissions}
        onSelectScope={modal.actions.selectScope}
        onSetPendingAction={modal.actions.setPendingAction}
        onSetActionData={modal.actions.setActionData}
        onExecuteAction={modal.actions.executeAction}
        onClose={modal.actions.close}
      />

      {/* Create Availability Dialog */}
      <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-auto">
          <DialogHeader>
            <DialogTitle>Create Availability</DialogTitle>
          </DialogHeader>
          <AvailabilityCreationForm
            onSuccess={handleCreateSuccess}
            onCancel={handleCreateCancel}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Availability Dialog */}
      <Dialog open={showEditForm} onOpenChange={setShowEditForm}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-auto">
          <DialogHeader>
            <DialogTitle>Edit Availability</DialogTitle>
          </DialogHeader>
          {modal.state.selectedEvent && (
            <AvailabilityEditForm
              availabilityId={modal.state.selectedEvent.id}
              scope={editFormScope}
              onSuccess={handleEditSuccess}
              onCancel={handleEditCancel}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}