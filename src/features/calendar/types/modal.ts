export type AvailabilityAction = 'view' | 'edit' | 'delete' | 'accept' | 'reject';

export type SeriesActionScope = 'single' | 'all' | 'future';

export interface AvailabilityPermissions {
  canEdit: boolean;
  canDelete: boolean;
  canAccept: boolean;
  canReject: boolean;
  canCreate: boolean;
}
