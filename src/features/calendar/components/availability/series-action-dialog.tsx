import React from 'react';

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
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

export type SeriesActionScope = 'single' | 'future' | 'all';

// For consistency with existing DragDropCalendar pattern
export interface SeriesUpdateOptions {
  updateType: 'single' | 'thisAndFuture' | 'allOccurrences';
  propagateChanges: boolean;
  maintainPattern: boolean;
}

export interface SeriesActionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (scope: SeriesActionScope) => void;
  actionType: 'edit' | 'delete' | 'cancel';
  availabilityTitle: string;
  availabilityDate: string;
  isDestructive?: boolean;
}

// Helper function to convert between scope formats
export function convertScopeToUpdateType(
  scope: SeriesActionScope
): SeriesUpdateOptions['updateType'] {
  switch (scope) {
    case 'single':
      return 'single';
    case 'future':
      return 'thisAndFuture';
    case 'all':
      return 'allOccurrences';
    default:
      return 'single';
  }
}

export function convertUpdateTypeToScope(
  updateType: SeriesUpdateOptions['updateType']
): SeriesActionScope {
  switch (updateType) {
    case 'single':
      return 'single';
    case 'thisAndFuture':
      return 'future';
    case 'allOccurrences':
      return 'all';
    default:
      return 'single';
  }
}

export function SeriesActionDialog({
  isOpen,
  onClose,
  onConfirm,
  actionType,
  availabilityTitle,
  availabilityDate,
  isDestructive = false,
}: SeriesActionDialogProps) {
  const [selectedScope, setSelectedScope] = React.useState<SeriesActionScope>('single');

  const handleConfirm = () => {
    onConfirm(selectedScope);
  };

  const getActionText = () => {
    switch (actionType) {
      case 'edit':
        return 'edit';
      case 'delete':
        return 'delete';
      case 'cancel':
        return 'cancel';
      default:
        return 'modify';
    }
  };

  const getTitle = () => {
    const action = getActionText();
    return `${action.charAt(0).toUpperCase() + action.slice(1)} Recurring Availability`;
  };

  const getDescription = () => {
    const action = getActionText();
    return `You are about to ${action} a recurring availability. Choose which occurrences you want to affect:`;
  };

  const getScopeDescription = (scope: SeriesActionScope) => {
    const action = getActionText();
    switch (scope) {
      case 'single':
        return `${action.charAt(0).toUpperCase() + action.slice(1)} only this occurrence (${availabilityDate})`;
      case 'future':
        return `${action.charAt(0).toUpperCase() + action.slice(1)} this and all future occurrences`;
      case 'all':
        return `${action.charAt(0).toUpperCase() + action.slice(1)} all occurrences in this series`;
      default:
        return '';
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="sm:max-w-[425px]">
        <AlertDialogHeader>
          <AlertDialogTitle>{getTitle()}</AlertDialogTitle>
          <AlertDialogDescription>{getDescription()}</AlertDialogDescription>
        </AlertDialogHeader>

        <div className="py-4">
          <div className="mb-4">
            <p className="text-sm font-medium">{availabilityTitle}</p>
            <p className="text-sm text-gray-600">{availabilityDate}</p>
          </div>

          <RadioGroup
            value={selectedScope}
            onValueChange={(value) => setSelectedScope(value as SeriesActionScope)}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="single" id="single" />
              <Label htmlFor="single" className="text-sm">
                {getScopeDescription('single')}
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="future" id="future" />
              <Label htmlFor="future" className="text-sm">
                {getScopeDescription('future')}
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="all" id="all" />
              <Label htmlFor="all" className="text-sm">
                {getScopeDescription('all')}
              </Label>
            </div>
          </RadioGroup>

          {selectedScope === 'all' && actionType === 'delete' && (
            <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3">
              <p className="text-sm text-red-700">
                ⚠️ This will permanently delete all occurrences of this recurring availability.
              </p>
            </div>
          )}

          {selectedScope === 'future' && actionType === 'delete' && (
            <div className="mt-4 rounded-md border border-yellow-200 bg-yellow-50 p-3">
              <p className="text-sm text-yellow-700">
                ⚠️ This will delete the current occurrence and all future occurrences.
              </p>
            </div>
          )}

          {selectedScope === 'all' && actionType === 'cancel' && (
            <div className="mt-4 rounded-md border border-orange-200 bg-orange-50 p-3">
              <p className="text-sm text-orange-700">
                ⚠️ This will cancel all occurrences in this series.
              </p>
            </div>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className={isDestructive ? 'bg-red-600 hover:bg-red-700' : ''}
          >
            {getActionText().charAt(0).toUpperCase() + getActionText().slice(1)}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default SeriesActionDialog;
