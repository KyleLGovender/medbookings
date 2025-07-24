// =============================================================================
// GLOBAL API TYPES
// =============================================================================
// Global API response and error handling types used across all features
// Organized by: Response Types -> Error Types -> Utility Types

// =============================================================================
// RESPONSE TYPES
// =============================================================================

export type ApiResponse<T> = {
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string[]>;
  formErrors?: string[];
};

// =============================================================================
// UTILITY TYPES
// =============================================================================

// Add future global API utility types here
