import { useReducer, useCallback } from 'react';
import type {
  CalendarEventModalState,
  CalendarEventModalAction,
  CalendarEventAction,
  CalendarEventModalOptions,
  SeriesActionScope,
} from '@/features/calendar/types/modal';
import type { CalendarEvent } from '@/features/calendar/types/types';

const initialState: CalendarEventModalState = {
  isOpen: false,
  selectedEvent: null,
  currentStep: 'event-details',
  selectedScope: null,
  pendingAction: null,
  actionData: {},
};

const calendarEventModalReducer = (
  state: CalendarEventModalState,
  action: CalendarEventModalAction
): CalendarEventModalState => {
  switch (action.type) {
    case 'OPEN_EVENT':
      return {
        isOpen: true,
        selectedEvent: action.event,
        currentStep: action.event.isRecurring ? 'scope-selection' : 'event-details',
        selectedScope: action.event.isRecurring ? null : 'single',
        pendingAction: action.action || 'view',
        actionData: {},
      };

    case 'SELECT_SCOPE':
      return {
        ...state,
        selectedScope: action.scope,
        currentStep: state.pendingAction === 'view' ? 'event-details' : 'action-confirmation',
      };

    case 'SET_PENDING_ACTION':
      const needsConfirmation = ['delete', 'cancel', 'reject'].includes(action.action);
      return {
        ...state,
        pendingAction: action.action,
        currentStep: needsConfirmation ? 'action-confirmation' : 'event-details',
      };

    case 'SET_ACTION_DATA':
      return {
        ...state,
        actionData: { ...state.actionData, ...action.data },
      };

    case 'PROCEED_TO_NEXT_STEP':
      return {
        ...state,
        currentStep: 'action-confirmation',
      };

    case 'CLOSE':
      return initialState;

    default:
      return state;
  }
};

export const useCalendarEventModal = (options: CalendarEventModalOptions = {}) => {
  const [state, dispatch] = useReducer(calendarEventModalReducer, initialState);

  const openEvent = useCallback(
    (event: CalendarEvent, action: CalendarEventAction = 'view') => {
      dispatch({ type: 'OPEN_EVENT', event, action });
    },
    []
  );

  const selectScope = useCallback((scope: SeriesActionScope) => {
    dispatch({ type: 'SELECT_SCOPE', scope });
  }, []);

  const setPendingAction = useCallback((action: CalendarEventAction) => {
    dispatch({ type: 'SET_PENDING_ACTION', action });
  }, []);

  const setActionData = useCallback((data: Record<string, any>) => {
    dispatch({ type: 'SET_ACTION_DATA', data });
  }, []);

  const proceedToNextStep = useCallback(() => {
    dispatch({ type: 'PROCEED_TO_NEXT_STEP' });
  }, []);

  const executeAction = useCallback(() => {
    if (!state.selectedEvent || !state.pendingAction || !state.selectedScope) return;

    const { selectedEvent, pendingAction, selectedScope, actionData } = state;

    switch (pendingAction) {
      case 'edit':
        options.onEdit?.(selectedEvent, selectedScope);
        break;
      case 'delete':
        options.onDelete?.(selectedEvent, selectedScope);
        break;
      case 'cancel':
        options.onCancel?.(selectedEvent, selectedScope, actionData.reason);
        break;
      case 'accept':
        options.onAccept?.(selectedEvent);
        break;
      case 'reject':
        options.onReject?.(selectedEvent, actionData.reason);
        break;
    }

    dispatch({ type: 'CLOSE' });
  }, [state, options]);

  const close = useCallback(() => {
    dispatch({ type: 'CLOSE' });
  }, []);

  return {
    state,
    actions: {
      openEvent,
      selectScope,
      setPendingAction,
      setActionData,
      proceedToNextStep,
      executeAction,
      close,
    },
  };
};