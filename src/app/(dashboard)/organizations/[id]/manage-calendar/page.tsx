'use client';

import React, { useState } from 'react';

import { AvailabilityStatus } from '@prisma/client';
import { Calendar, Check, Edit, Pause, Trash2, X } from 'lucide-react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AvailabilityCreationForm } from '@/features/calendar/components/availability/availability-creation-form';
import { AvailabilityEditForm } from '@/features/calendar/components/availability/availability-edit-form';
import { AvailabilityViewModal } from '@/features/calendar/components/availability/availability-view-modal';
import {
  SeriesActionDialog,
  SeriesActionScope,
} from '@/features/calendar/components/availability/series-action-dialog';
import { OrganizationCalendarView } from '@/features/calendar/components/organization-calendar-view';
import {
  useAcceptAvailabilityProposal,
  useDeleteAvailability,
  useRejectAvailabilityProposal,
} from '@/features/calendar/hooks/use-availability';
import { CalendarEvent, OrganizationProvider } from '@/features/calendar/types/types';
import { useToast } from '@/hooks/use-toast';

interface OrganizationAvailabilityPageProps {
  params: {
    id: string;
  };
}

export default function OrganizationAvailabilityPage({
  params,
}: OrganizationAvailabilityPageProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<OrganizationProvider | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [cancellationReason, setCancellationReason] = useState('');
  const [showEventDetailsModal, setShowEventDetailsModal] = useState(false);
  const [showSeriesActionDialog, setShowSeriesActionDialog] = useState(false);
  const [seriesActionType, setSeriesActionType] = useState<'edit' | 'delete' | 'cancel'>('edit');
  const [pendingSeriesScope, setPendingSeriesScope] = useState<SeriesActionScope | null>(null);
  const [editFormScope, setEditFormScope] = useState<SeriesActionScope>('single');
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingAvailabilityId, setViewingAvailabilityId] = useState<string | null>(null);
  const [createProviderId, setCreateProviderId] = useState<string | null>(null);

  const { toast } = useToast();

  // Similar mutations as in provider calendar
  const acceptMutation = useAcceptAvailabilityProposal({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Availability proposal accepted',
      });
      setSelectedEvent(null);
    },
  });

  const rejectMutation = useRejectAvailabilityProposal({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Availability proposal rejected',
      });
      setSelectedEvent(null);
      setRejectionReason('');
    },
  });

  const deleteMutation = useDeleteAvailability({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Availability deleted successfully',
      });
      setSelectedEvent(null);
    },
  });


  const handleCreateAvailability = (providerId?: string) => {
    setCreateProviderId(providerId || null);
    setShowCreateForm(true);
  };

  const handleCreateSuccess = () => {
    setShowCreateForm(false);
  };

  const handleCreateCancel = () => {
    setShowCreateForm(false);
  };

  const handleEventClick = (event: CalendarEvent, provider: OrganizationProvider) => {
    // Only show modal for availability events (not bookings)
    if (event.type === 'availability') {
      setSelectedEvent(event);
      setSelectedProvider(provider);
      setShowEventDetailsModal(true);
    }
  };

  const handleEditEvent = () => {
    setShowEventDetailsModal(false);
    if (selectedEvent && selectedEvent.isRecurring) {
      // Show series action dialog for recurring availability
      setSeriesActionType('edit');
      setShowSeriesActionDialog(true);
    } else {
      // Direct edit for single availability
      setShowEditForm(true);
    }
  };

  const handleDeleteEvent = () => {
    setShowEventDetailsModal(false);
    if (selectedEvent && selectedEvent.isRecurring) {
      // Show series action dialog for recurring availability
      setSeriesActionType('delete');
      setShowSeriesActionDialog(true);
    } else {
      // Direct delete for single availability
      setShowDeleteDialog(true);
    }
  };

  const handleCancelEvent = () => {
    setShowEventDetailsModal(false);
    if (selectedEvent && selectedEvent.isRecurring) {
      // Show series action dialog for recurring availability
      setSeriesActionType('cancel');
      setShowSeriesActionDialog(true);
    } else if (selectedEvent && !selectedEvent.isProviderCreated) {
      // Organization-created availability - show reason dialog
      setShowCancelDialog(true);
    } else {
      // Provider-created availability - no reason needed
      if (selectedEvent) {
        cancelMutation.mutate({ ids: [selectedEvent.id] });
      }
    }
  };

  const handleSeriesAction = (scope: SeriesActionScope) => {
    setShowSeriesActionDialog(false);
    if (!selectedEvent) return;

    switch (seriesActionType) {
      case 'edit':
        // For series editing, pass scope to edit form
        setEditFormScope(scope);
        setShowEditForm(true);
        break;
      case 'delete':
        // Delete with scope parameter - pass as array with scope
        deleteMutation.mutate({ ids: [selectedEvent.id], scope });
        break;
      case 'cancel':
        // Cancel with scope parameter
        if (!selectedEvent.isProviderCreated) {
          // For organization-created availability, show reason dialog
          setPendingSeriesScope(scope);
          setShowCancelDialog(true);
        } else {
          // Provider-created availability - no reason needed
          cancelMutation.mutate({ ids: [selectedEvent.id], scope });
        }
        break;
    }
  };

  const handleSeriesActionCancel = () => {
    setShowSeriesActionDialog(false);
    setPendingSeriesScope(null);
    setSelectedEvent(null);
  };

  const handleEditSuccess = () => {
    setShowEditForm(false);
    setSelectedEvent(null);
  };

  const handleEditCancel = () => {
    setShowEditForm(false);
    setSelectedEvent(null);
  };

  return (
    <>
      <OrganizationCalendarView
        organizationId={params.id}
        onCreateAvailability={handleCreateAvailability}
        onEventClick={handleEventClick}
      />

      {/* Create Availability Dialog */}
      <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-auto">
          <DialogHeader>
            <DialogTitle>Create Availability</DialogTitle>
          </DialogHeader>
          {createProviderId ? (
            <AvailabilityCreationForm
              providerId={createProviderId}
              organizationId={params.id}
              onSuccess={handleCreateSuccess}
              onCancel={handleCreateCancel}
            />
          ) : (
            <div className="p-4 text-center text-muted-foreground">
              Please select a provider to create availability
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Availability Dialog */}
      <Dialog open={showEditForm} onOpenChange={setShowEditForm}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-auto">
          <DialogHeader>
            <DialogTitle>Edit Availability</DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <AvailabilityEditForm
              availabilityId={selectedEvent.id}
              scope={editFormScope}
              onSuccess={handleEditSuccess}
              onCancel={handleEditCancel}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Series Action Dialog */}
      {selectedEvent && (
        <SeriesActionDialog
          isOpen={showSeriesActionDialog}
          onClose={handleSeriesActionCancel}
          onConfirm={handleSeriesAction}
          actionType={seriesActionType}
          availabilityTitle={selectedEvent.title}
          availabilityDate={selectedEvent.startTime.toLocaleDateString()}
          isDestructive={seriesActionType === 'delete' || seriesActionType === 'cancel'}
        />
      )}

      {/* Event Details Modal */}
      <Dialog open={showEventDetailsModal} onOpenChange={setShowEventDetailsModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Availability Details</DialogTitle>
          </DialogHeader>
          {selectedEvent && selectedProvider && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Provider</Label>
                <div className="text-sm text-muted-foreground">{selectedProvider.name}</div>
              </div>
              <div>
                <Label className="text-sm font-medium">Title</Label>
                <div className="text-sm text-muted-foreground">{selectedEvent.title}</div>
              </div>
              <div>
                <Label className="text-sm font-medium">Time</Label>
                <div className="text-sm text-muted-foreground">
                  {selectedEvent.startTime.toLocaleString()} -{' '}
                  {selectedEvent.endTime.toLocaleString()}
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Status</Label>
                <div className="text-sm text-muted-foreground">{selectedEvent.status}</div>
              </div>
              {selectedEvent.isRecurring && (
                <div>
                  <Label className="text-sm font-medium">Recurring</Label>
                  <div className="text-sm text-muted-foreground">
                    This is part of a recurring series
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2">
                {selectedEvent.status === AvailabilityStatus.PENDING && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowEventDetailsModal(false);
                        acceptMutation.mutate({ id: selectedEvent.id });
                      }}
                    >
                      <Check className="mr-1 h-4 w-4" />
                      Accept
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowEventDetailsModal(false);
                        setShowRejectDialog(true);
                      }}
                    >
                      <X className="mr-1 h-4 w-4" />
                      Reject
                    </Button>
                  </>
                )}
                <Button variant="outline" size="sm" onClick={handleEditEvent}>
                  <Edit className="mr-1 h-4 w-4" />
                  Edit
                </Button>
                <Button variant="outline" size="sm" onClick={handleCancelEvent}>
                  <Pause className="mr-1 h-4 w-4" />
                  Cancel
                </Button>
                <Button variant="outline" size="sm" onClick={handleDeleteEvent}>
                  <Trash2 className="mr-1 h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Other dialogs similar to provider calendar... */}
    </>
  );
}
