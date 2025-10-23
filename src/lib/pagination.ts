import { z } from 'zod';

/**
 * Reusable pagination schema for all list queries
 * Prevents unbounded queries that could cause memory exhaustion
 */
export const paginationSchema = z.object({
  take: z.number().min(1).max(100).default(50).optional(),
  skip: z.number().min(0).default(0).optional(),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

/**
 * Default pagination limits to prevent unbounded queries
 */
export const DEFAULT_PAGINATION = {
  take: 50,
  skip: 0,
} as const;

/**
 * Maximum allowed page size
 */
export const MAX_PAGE_SIZE = 100;
