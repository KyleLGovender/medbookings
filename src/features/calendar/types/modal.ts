import { CalendarEvent } from './types';

export type SeriesActionScope = 'single' | 'future' | 'all';

export type CalendarEventAction = 'view' | 'edit' | 'delete' | 'accept' | 'reject' | 'create';

export interface CalendarEventModalState {
  isOpen: boolean;
  selectedEvent: CalendarEvent | null;
  currentStep: 'scope-selection' | 'event-details' | 'action-confirmation';
  selectedScope: SeriesActionScope | null;
  pendingAction: CalendarEventAction | null;
  actionData: Record<string, any>; // For action-specific data (like rejection reason)
}

export type CalendarEventModalAction = 
  | { type: 'OPEN_EVENT'; event: CalendarEvent; action?: CalendarEventAction }
  | { type: 'SELECT_SCOPE'; scope: SeriesActionScope }
  | { type: 'SET_PENDING_ACTION'; action: CalendarEventAction }
  | { type: 'SET_ACTION_DATA'; data: Record<string, any> }
  | { type: 'PROCEED_TO_NEXT_STEP' }
  | { type: 'CLOSE' };

export interface CalendarEventPermissions {
  canEdit: boolean;
  canDelete: boolean;
  canAccept: boolean;
  canReject: boolean;
  canView: boolean;
}

export interface CalendarEventModalOptions {
  onEdit?: (event: CalendarEvent, scope: SeriesActionScope) => void;
  onDelete?: (event: CalendarEvent, scope: SeriesActionScope) => void;
  onAccept?: (event: CalendarEvent) => void;
  onReject?: (event: CalendarEvent, reason?: string) => void;
}

export interface CalendarEventModalContentProps {
  event: CalendarEvent;
  currentStep: CalendarEventModalState['currentStep'];
  selectedScope: SeriesActionScope | null;
  pendingAction: CalendarEventAction | null;
  actionData: Record<string, any>;
  permissions: CalendarEventPermissions;
  customActions?: CalendarEventAction[];
  onSelectScope: (scope: SeriesActionScope) => void;
  onSetPendingAction: (action: CalendarEventAction) => void;
  onSetActionData: (data: Record<string, any>) => void;
  onExecuteAction: () => void;
  onClose: () => void;
}