import { createTRPCRouter } from '@/server/trpc';
import { calendarRouter } from './routers/calendar';
import { debugRouter } from './routers/debug';
import { invitationsRouter } from './routers/invitations';
import { profileRouter } from './routers/profile';
import { providersRouter } from './routers/providers';

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  calendar: calendarRouter,
  debug: debugRouter,
  invitations: invitationsRouter,
  profile: profileRouter,
  providers: providersRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;