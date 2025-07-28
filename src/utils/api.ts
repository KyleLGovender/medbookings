import { createTRPCReact } from '@trpc/react-query';
import { type inferRouterInputs, type inferRouterOutputs } from '@trpc/server';

import { type AppRouter } from '@/server/api/root';

/** A set of type-safe react-query hooks for your tRPC API. */
export const api = createTRPCReact<AppRouter>();

/**
 * Inference helper for inputs.
 *
 * @example type HelloInput = RouterInputs['example']['hello']
 */
export type RouterInputs = inferRouterInputs<AppRouter>;

/**
 * Inference helper for outputs.
 *
 * @example type HelloOutput = RouterOutputs['example']['hello']
 */
export type RouterOutputs = inferRouterOutputs<AppRouter>;
