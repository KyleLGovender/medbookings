/**
 * NextAuth v5 API Route Handler
 *
 * NextAuth v5 provides pre-built handlers that we simply export.
 * No need for custom wrapper logic or dynamic imports.
 *
 * The handlers are generated in /src/lib/auth.ts via NextAuth(authConfig)
 */
import { handlers } from '@/lib/auth';

// Export NextAuth v5 handlers directly
export const { GET, POST } = handlers;
