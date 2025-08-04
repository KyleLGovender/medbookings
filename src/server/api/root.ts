import { createTRPCRouter } from '@/server/trpc';

import { adminRouter } from './routers/admin';
import { calendarRouter } from './routers/calendar';
import { communicationsRouter } from './routers/communications';
import { debugRouter } from './routers/debug';
import { organizationsRouter } from './routers/organizations';
import { profileRouter } from './routers/profile';
import { providersRouter } from './routers/providers';

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  admin: adminRouter,
  // billing: billingRouter,
  calendar: calendarRouter,
  communications: communicationsRouter,
  debug: debugRouter,
  organizations: organizationsRouter,
  profile: profileRouter,
  providers: providersRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
