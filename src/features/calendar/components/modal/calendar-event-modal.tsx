import React from 'react';

import { Dialog, DialogContent } from '@/components/ui/dialog';

import { ActionConfirmationStep } from './action-confirmation-step';
import { EventDetailsStep } from './event-details-step';
import { ScopeSelectionStep } from './scope-selection-step';

import type {
  CalendarEventModalState,
  CalendarEventPermissions,
  CalendarEventAction,
} from '@/features/calendar/types/modal';
import type { CalendarEvent } from '@/features/calendar/types/types';

interface CalendarEventModalProps {
  state: CalendarEventModalState;
  permissions: CalendarEventPermissions;
  customActions?: CalendarEventAction[];
  onSelectScope: (scope: any) => void;
  onSetPendingAction: (action: CalendarEventAction) => void;
  onSetActionData: (data: Record<string, any>) => void;
  onExecuteAction: () => void;
  onClose: () => void;
}

export function CalendarEventModal({
  state,
  permissions,
  customActions = [],
  onSelectScope,
  onSetPendingAction,
  onSetActionData,
  onExecuteAction,
  onClose,
}: CalendarEventModalProps) {
  if (!state.isOpen || !state.selectedEvent) return null;

  const getMaxWidth = () => {
    switch (state.currentStep) {
      case 'scope-selection':
        return 'max-w-md';
      case 'action-confirmation':
        return 'max-w-md';
      case 'event-details':
      default:
        return 'max-w-2xl';
    }
  };

  return (
    <Dialog open={state.isOpen} onOpenChange={() => onClose()}>
      <DialogContent className={`max-h-[90vh] overflow-y-auto ${getMaxWidth()}`}>
        <CalendarEventModalContent
          event={state.selectedEvent}
          currentStep={state.currentStep}
          selectedScope={state.selectedScope}
          pendingAction={state.pendingAction}
          actionData={state.actionData}
          permissions={permissions}
          customActions={customActions}
          onSelectScope={onSelectScope}
          onSetPendingAction={onSetPendingAction}
          onSetActionData={onSetActionData}
          onExecuteAction={onExecuteAction}
          onClose={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}

interface CalendarEventModalContentProps {
  event: CalendarEvent;
  currentStep: CalendarEventModalState['currentStep'];
  selectedScope: CalendarEventModalState['selectedScope'];
  pendingAction: CalendarEventModalState['pendingAction'];
  actionData: CalendarEventModalState['actionData'];
  permissions: CalendarEventPermissions;
  customActions: CalendarEventAction[];
  onSelectScope: (scope: any) => void;
  onSetPendingAction: (action: CalendarEventAction) => void;
  onSetActionData: (data: Record<string, any>) => void;
  onExecuteAction: () => void;
  onClose: () => void;
}

function CalendarEventModalContent({
  event,
  currentStep,
  selectedScope,
  pendingAction,
  actionData,
  permissions,
  customActions,
  onSelectScope,
  onSetPendingAction,
  onSetActionData,
  onExecuteAction,
  onClose,
}: CalendarEventModalContentProps) {
  // Step 1: Scope Selection (for recurring events)
  if (currentStep === 'scope-selection' && event.isRecurring) {
    return (
      <ScopeSelectionStep
        event={event}
        action={pendingAction}
        onSelect={onSelectScope}
        onCancel={onClose}
      />
    );
  }

  // Step 2: Event Details (main view)
  if (currentStep === 'event-details') {
    return (
      <EventDetailsStep
        event={event}
        scope={selectedScope}
        permissions={permissions}
        customActions={customActions}
        onActionClick={onSetPendingAction}
        onClose={onClose}
      />
    );
  }

  // Step 3: Action Confirmation (for destructive actions)
  if (currentStep === 'action-confirmation') {
    return (
      <ActionConfirmationStep
        event={event}
        action={pendingAction}
        scope={selectedScope}
        onConfirm={onExecuteAction}
        onCancel={onClose}
        onSetActionData={onSetActionData}
      />
    );
  }

  return null;
}

export default CalendarEventModal;