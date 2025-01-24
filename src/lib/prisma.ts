import { PrismaClient } from "@prisma/client";

import env from "@/config/env/server";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

// Only assign to global object during development and only on server
if (env.NODE_ENV !== "production" && typeof window === "undefined") {
  globalForPrisma.prisma = prisma;
}
