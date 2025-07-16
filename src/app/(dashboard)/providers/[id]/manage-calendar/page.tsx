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
import { AvailabilityViewModal } from '@/features/calendar/availability/components/availability-view-modal';
import { ProviderCalendarView } from '@/features/calendar/availability/components/provider-calendar-view';
import { SeriesActionDialog, SeriesActionScope } from '@/features/calendar/availability/components/series-action-dialog';
import {
  useAcceptAvailabilityProposal,
  useAvailabilityById,
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
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [cancellationReason, setCancellationReason] = useState('');
  const [showEventDetailsModal, setShowEventDetailsModal] = useState(false);
  const [showSeriesActionDialog, setShowSeriesActionDialog] = useState(false);
  const [seriesActionType, setSeriesActionType] = useState<'edit' | 'delete' | 'cancel'>('edit');
  const [pendingSeriesScope, setPendingSeriesScope] = useState<SeriesActionScope | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingAvailabilityId, setViewingAvailabilityId] = useState<string | null>(null);

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
    // Only show modal for availability events (not bookings)
    if (event.type === 'availability') {
      setSelectedEvent(event);
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
    } else if (selectedEvent) {
      // Provider-created availability - no reason needed
      cancelMutation.mutate({ id: selectedEvent.id });
    }
  };

  const handleAcceptEvent = () => {
    setShowEventDetailsModal(false);
    if (selectedEvent) {
      acceptMutation.mutate({ id: selectedEvent.id });
    }
  };

  const handleRejectEvent = () => {
    setShowEventDetailsModal(false);
    if (selectedEvent) {
      // Always show reason dialog for rejection
      setShowRejectDialog(true);
    }
  };

  const handleViewDetails = () => {
    setShowEventDetailsModal(false);
    if (selectedEvent && selectedEvent.type === 'availability') {
      setViewingAvailabilityId(selectedEvent.id);
      setShowViewModal(true);
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

  const handleModalClose = () => {
    setShowEventDetailsModal(false);
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
      cancelMutation.mutate({ 
        id: selectedEvent.id, 
        reason: cancellationReason,
        scope: pendingSeriesScope || 'single'
      });
    }
    setShowCancelDialog(false);
    setCancellationReason('');
    setPendingSeriesScope(null);
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
    setPendingSeriesScope(null);
    setSelectedEvent(null);
  };

  const handleSeriesAction = (scope: SeriesActionScope) => {
    setShowSeriesActionDialog(false);
    
    if (!selectedEvent) return;

    switch (seriesActionType) {
      case 'edit':
        // For series editing, pass scope to edit form
        // TODO: Update edit form to handle scope parameter
        setShowEditForm(true);
        break;
      case 'delete':
        // Delete with scope parameter
        deleteMutation.mutate({ id: selectedEvent.id, scope });
        break;
      case 'cancel':
        // Cancel with scope parameter
        if (!selectedEvent.isProviderCreated) {
          // For organization-created availability, show reason dialog
          setPendingSeriesScope(scope);
          setShowCancelDialog(true);
        } else {
          // Provider-created availability - no reason needed
          cancelMutation.mutate({ id: selectedEvent.id, scope });
        }
        break;
    }
  };

  const handleSeriesActionCancel = () => {
    setShowSeriesActionDialog(false);
    setPendingSeriesScope(null);
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

      {/* Event Details Modal */}
      <Dialog open={showEventDetailsModal} onOpenChange={setShowEventDetailsModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Event Details</DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-lg">{selectedEvent.title}</div>
                    <div className="text-sm text-gray-600">
                      {selectedEvent.startTime.toLocaleString([], {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}{' '}
                      -{' '}
                      {selectedEvent.endTime.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {/* Dynamic action buttons based on availability status and creation type */}
                    {selectedEvent.isProviderCreated ? (
                      // Provider-created availabilities - always show edit/delete/cancel options
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:border-blue-400"
                          onClick={handleEditEvent}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-red-300 bg-red-50 text-red-700 hover:bg-red-100 hover:border-red-400"
                          onClick={handleDeleteEvent}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </Button>
                        {selectedEvent.status !== AvailabilityStatus.CANCELLED && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-orange-300 bg-orange-50 text-orange-700 hover:bg-orange-100 hover:border-orange-400"
                            onClick={handleCancelEvent}
                            disabled={cancelMutation.isPending}
                          >
                            <Pause className="mr-2 h-4 w-4" />
                            {cancelMutation.isPending ? 'Cancelling...' : 'Cancel'}
                          </Button>
                        )}
                      </>
                    ) : (
                      // Organization-created availabilities - full workflow
                      <>
                        {selectedEvent.status === AvailabilityStatus.PENDING && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-green-300 bg-green-50 text-green-700 hover:bg-green-100 hover:border-green-400"
                              onClick={handleAcceptEvent}
                              disabled={acceptMutation.isPending}
                            >
                              <Check className="mr-2 h-4 w-4" />
                              {acceptMutation.isPending ? 'Accepting...' : 'Accept'}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-red-300 bg-red-50 text-red-700 hover:bg-red-100 hover:border-red-400"
                              onClick={handleRejectEvent}
                              disabled={rejectMutation.isPending}
                            >
                              <X className="mr-2 h-4 w-4" />
                              {rejectMutation.isPending ? 'Rejecting...' : 'Reject'}
                            </Button>
                          </>
                        )}

                        {selectedEvent.status === AvailabilityStatus.ACCEPTED && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-orange-300 bg-orange-50 text-orange-700 hover:bg-orange-100 hover:border-orange-400"
                            onClick={handleCancelEvent}
                            disabled={cancelMutation.isPending}
                          >
                            <Pause className="mr-2 h-4 w-4" />
                            {cancelMutation.isPending ? 'Cancelling...' : 'Cancel'}
                          </Button>
                        )}

                        {(selectedEvent.status === AvailabilityStatus.REJECTED ||
                          selectedEvent.status === AvailabilityStatus.CANCELLED) && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100 hover:border-gray-400"
                            onClick={handleViewDetails}
                          >
                            <Calendar className="mr-2 h-4 w-4" />
                            View Details
                          </Button>
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
                
                {/* Creator Information */}
                <div className="rounded-lg border bg-gray-50 p-4">
                  <div className="text-sm font-medium text-gray-700 mb-2">
                    {selectedEvent.isProviderCreated ? 'Provider Created' : `${selectedEvent.organization?.name || 'Organization'} Created`}
                  </div>
                  <div className="text-sm">
                    {selectedEvent.createdBy && (
                      <>
                        <div className="text-xs text-gray-600 mb-1">
                          Created by
                        </div>
                        <div className="text-sm font-medium">
                          {selectedEvent.createdBy.name}
                        </div>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedEvent.service && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-gray-700">Service Details</div>
                      <div className="text-sm"><strong>Service:</strong> {selectedEvent.service.name}</div>
                      {selectedEvent.service.duration && (
                        <div className="text-sm"><strong>Duration:</strong> {selectedEvent.service.duration} minutes</div>
                      )}
                      {selectedEvent.service.price && (
                        <div className="text-sm"><strong>Price:</strong> R{selectedEvent.service.price}</div>
                      )}
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-700">Additional Information</div>
                    {selectedEvent.location && (
                      <div className="text-sm">
                        <strong>Location:</strong> {selectedEvent.location.isOnline ? 'Online' : selectedEvent.location.name}
                      </div>
                    )}
                    {selectedEvent.customer && (
                      <div className="text-sm"><strong>Customer:</strong> {selectedEvent.customer.name}</div>
                    )}
                    <div className="text-sm">
                      <strong>Status:</strong> <span className="capitalize">{selectedEvent.status.toLowerCase().replace('_', ' ')}</span>
                    </div>
                    {selectedEvent.isRecurring && (
                      <div className="text-sm">
                        <strong>Recurring:</strong> Yes
                        {selectedEvent.seriesId && (
                          <div className="text-xs text-gray-600">Series ID: {selectedEvent.seriesId}</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

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

      {/* Availability View Modal */}
      <AvailabilityViewModal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setViewingAvailabilityId(null);
        }}
        availabilityId={viewingAvailabilityId}
      />
    </>
  );
}
