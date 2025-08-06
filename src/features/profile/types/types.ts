// =============================================================================
// PROFILE FEATURE DOMAIN TYPES
// =============================================================================
// Domain logic types for profile feature (client-side concerns only)
// Server data types are automatically inferred from tRPC procedures

// =============================================================================
// FORM STATE TYPES
// =============================================================================

export interface ProfileFormState {
  isEditing: boolean;
  isDirty: boolean;
  isSubmitting: boolean;
}

// =============================================================================
// UI STATE TYPES
// =============================================================================

export interface ProfilePageState {
  showDeleteConfirmation: boolean;
  activeTab: 'profile' | 'security' | 'preferences';
}
