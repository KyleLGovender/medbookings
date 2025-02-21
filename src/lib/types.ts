export type ApiResponse<T> = {
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string[]>;
  formErrors?: string[];
};
