'use client';

import React, { useState } from 'react';

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
import { AvailabilityCreationForm } from '@/features/calendar/availability/components/availability-creation-form';
import { AvailabilityEditForm } from '@/features/calendar/availability/components/availability-edit-form';
import { ProviderCalendarView } from '@/features/calendar/availability/components/provider-calendar-view';
import {
  useAcceptAvailabilityProposal,
  useCancelAvailability,
  useDeleteAvailability,
  useRejectAvailabilityProposal,
} from '@/features/calendar/availability/hooks/use-availability';
import { AvailabilityStatus, CalendarEvent } from '@/features/calendar/availability/types/types';
import { useToast } from '@/hooks/use-toast';

interface ProviderAvailabilityPageProps {
  params: {
    id: string;
  };
}

export default function ProviderAvailabilityPage({ params }: ProviderAvailabilityPageProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [cancellationReason, setCancellationReason] = useState('');

  const { toast } = useToast();

  const deleteMutation = useDeleteAvailability({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Availability deleted successfully',
      });
      setShowDeleteDialog(false);
      setSelectedEvent(null);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const cancelMutation = useCancelAvailability({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Availability cancelled successfully',
      });
      setSelectedEvent(null);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const acceptMutation = useAcceptAvailabilityProposal({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Availability proposal accepted',
      });
      setSelectedEvent(null);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const rejectMutation = useRejectAvailabilityProposal({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Availability proposal rejected',
      });
      setSelectedEvent(null);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleCreateAvailability = () => {
    setShowCreateForm(true);
  };

  const handleCreateSuccess = () => {
    setShowCreateForm(false);
    // The calendar will automatically refresh due to the mutation
  };

  const handleCreateCancel = () => {
    setShowCreateForm(false);
  };

  const handleEventClick = (event: CalendarEvent, clickEvent: React.MouseEvent) => {
    // Only show action menu for availability events (not bookings)
    if (event.type === 'availability') {
      setSelectedEvent(event);
      setMenuPosition({ x: clickEvent.clientX, y: clickEvent.clientY });
      setShowActionMenu(true);
    }
  };

  const handleEditEvent = () => {
    setShowActionMenu(false);
    setShowEditForm(true);
  };

  const handleDeleteEvent = () => {
    setShowActionMenu(false);
    setShowDeleteDialog(true);
  };

  const handleCancelEvent = () => {
    setShowActionMenu(false);
    if (selectedEvent && !selectedEvent.isProviderCreated) {
      // Organization-created availability - show reason dialog
      setShowCancelDialog(true);
    } else if (selectedEvent) {
      // Provider-created availability - no reason needed
      cancelMutation.mutate({ id: selectedEvent.id });
    }
  };

  const handleAcceptEvent = () => {
    setShowActionMenu(false);
    if (selectedEvent) {
      acceptMutation.mutate({ id: selectedEvent.id });
    }
  };

  const handleRejectEvent = () => {
    setShowActionMenu(false);
    if (selectedEvent) {
      // Always show reason dialog for rejection
      setShowRejectDialog(true);
    }
  };

  const handleEditSuccess = () => {
    setShowEditForm(false);
    setSelectedEvent(null);
    // The calendar will automatically refresh due to the mutation
  };

  const handleEditCancel = () => {
    setShowEditForm(false);
    setSelectedEvent(null);
  };

  const handleDeleteConfirm = () => {
    if (selectedEvent) {
      deleteMutation.mutate({ id: selectedEvent.id });
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteDialog(false);
    setSelectedEvent(null);
  };

  const handleMenuClose = () => {
    setShowActionMenu(false);
    setSelectedEvent(null);
  };

  const handleRejectConfirm = () => {
    if (selectedEvent) {
      rejectMutation.mutate({ id: selectedEvent.id, reason: rejectionReason });
    }
    setShowRejectDialog(false);
    setRejectionReason('');
    setSelectedEvent(null);
  };

  const handleCancelConfirm = () => {
    if (selectedEvent) {
      cancelMutation.mutate({ id: selectedEvent.id, reason: cancellationReason });
    }
    setShowCancelDialog(false);
    setCancellationReason('');
    setSelectedEvent(null);
  };

  const handleRejectCancel = () => {
    setShowRejectDialog(false);
    setRejectionReason('');
    setSelectedEvent(null);
  };

  const handleCancelCancel = () => {
    setShowCancelDialog(false);
    setCancellationReason('');
    setSelectedEvent(null);
  };

  return (
    <>
      <ProviderCalendarView
        providerId={params.id}
        onCreateAvailability={handleCreateAvailability}
        onEventClick={handleEventClick}
      />

      {/* Create Availability Dialog */}
      <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-auto">
          <DialogHeader>
            <DialogTitle>Create Availability</DialogTitle>
          </DialogHeader>
          <AvailabilityCreationForm
            serviceProviderId={params.id}
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
          {selectedEvent && (
            <AvailabilityEditForm
              availabilityId={selectedEvent.id}
              onSuccess={handleEditSuccess}
              onCancel={handleEditCancel}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Action Menu */}
      {showActionMenu && selectedEvent && (
        <div className="fixed inset-0 z-50" onClick={handleMenuClose}>
          <div
            className="absolute z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
            style={{
              left: `${menuPosition.x}px`,
              top: `${menuPosition.y}px`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Dynamic menu options based on availability status and creation type */}
            {selectedEvent.isProviderCreated ? (
              // Provider-created availabilities - always show edit/delete/cancel options
              <>
                <div className="px-2 py-1.5 text-xs font-medium text-green-600">
                  Provider Created
                </div>
                <div className="-mx-1 my-1 h-px bg-muted" />
                  <>
                    <button
                      className="relative flex w-full cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
                      onClick={handleEditEvent}
                    >
                      <Edit className="h-4 w-4" />
                      Edit
                    </button>
                    <button
                      className="relative flex w-full cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-red-600 outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
                      onClick={handleDeleteEvent}
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                    <div className="-mx-1 my-1 h-px bg-muted" />
                    <button
                      className="relative flex w-full cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-orange-600 outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
                      onClick={handleCancelEvent}
                      disabled={cancelMutation.isPending}
                    >
                      <Pause className="h-4 w-4" />
                      {cancelMutation.isPending ? 'Cancelling...' : 'Cancel'}
                    </button>
                  </>
              </>
            ) : (
              // Organization-created availabilities - full workflow
              <>
                <div className="px-2 py-1.5 text-xs font-medium text-blue-600">
                  {selectedEvent.organization?.name || 'Organization'} Created
                </div>
                <div className="-mx-1 my-1 h-px bg-muted" />

                {selectedEvent.status === AvailabilityStatus.PENDING && (
                  <>
                    <button
                      className="relative flex w-full cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-green-600 outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
                      onClick={handleAcceptEvent}
                      disabled={acceptMutation.isPending}
                    >
                      <Check className="h-4 w-4" />
                      {acceptMutation.isPending ? 'Accepting...' : 'Accept'}
                    </button>
                    <button
                      className="relative flex w-full cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-red-600 outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
                      onClick={handleRejectEvent}
                      disabled={rejectMutation.isPending}
                    >
                      <X className="h-4 w-4" />
                      {rejectMutation.isPending ? 'Rejecting...' : 'Reject'}
                    </button>
                  </>
                )}

                {selectedEvent.status === AvailabilityStatus.ACCEPTED && (
                  <>
                    <button
                      className="relative flex w-full cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-orange-600 outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
                      onClick={handleCancelEvent}
                      disabled={cancelMutation.isPending}
                    >
                      <Pause className="h-4 w-4" />
                      {cancelMutation.isPending ? 'Cancelling...' : 'Cancel'}
                    </button>
                  </>
                )}

                {(selectedEvent.status === AvailabilityStatus.REJECTED ||
                  selectedEvent.status === AvailabilityStatus.CANCELLED) && (
                  <>
                    <button
                      className="relative flex w-full cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
                      onClick={() => {
                        setShowActionMenu(false);
                        // TODO: Implement view details
                      }}
                    >
                      <Calendar className="h-4 w-4" />
                      View Details
                    </button>
                  </>
                )}
                
                {/* Default fallback for other statuses */}
                {selectedEvent.status !== AvailabilityStatus.PENDING && 
                 selectedEvent.status !== AvailabilityStatus.ACCEPTED && 
                 selectedEvent.status !== AvailabilityStatus.REJECTED && 
                 selectedEvent.status !== AvailabilityStatus.CANCELLED && (
                  <div className="px-2 py-1.5 text-xs text-gray-500">
                    No actions available for status: {selectedEvent.status}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Availability</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this availability?
              {selectedEvent && (
                <div className="mt-2 space-y-1 text-sm">
                  <div>
                    <strong>Service:</strong> {selectedEvent.title}
                  </div>
                  <div>
                    <strong>Time:</strong> {selectedEvent.startTime.toLocaleString()} -{' '}
                    {selectedEvent.endTime.toLocaleString()}
                  </div>
                </div>
              )}
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDeleteCancel}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Availability Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Availability</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedEvent && (
              <div className="space-y-2 text-sm">
                <div>
                  <strong>Service:</strong> {selectedEvent.title}
                </div>
                <div>
                  <strong>Time:</strong> {selectedEvent.startTime.toLocaleString()} -{' '}
                  {selectedEvent.endTime.toLocaleString()}
                </div>
                <div>
                  <strong>Created by:</strong> {selectedEvent.organization?.name || 'Organization'}
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="rejection-reason">Reason for rejection (optional)</Label>
              <Textarea
                id="rejection-reason"
                placeholder="Please provide a reason for rejecting this availability..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={handleRejectCancel}>
              Cancel
            </Button>
            <Button
              onClick={handleRejectConfirm}
              variant="destructive"
              disabled={rejectMutation.isPending}
            >
              {rejectMutation.isPending ? 'Rejecting...' : 'Reject'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel Availability Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel Availability</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedEvent && (
              <div className="space-y-2 text-sm">
                <div>
                  <strong>Service:</strong> {selectedEvent.title}
                </div>
                <div>
                  <strong>Time:</strong> {selectedEvent.startTime.toLocaleString()} -{' '}
                  {selectedEvent.endTime.toLocaleString()}
                </div>
                <div>
                  <strong>Created by:</strong> {selectedEvent.organization?.name || 'Organization'}
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="cancellation-reason">Reason for cancellation (optional)</Label>
              <Textarea
                id="cancellation-reason"
                placeholder="Please provide a reason for cancelling this availability..."
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={handleCancelCancel}>
              Cancel
            </Button>
            <Button
              onClick={handleCancelConfirm}
              variant="secondary"
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending ? 'Cancelling...' : 'Cancel Availability'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
