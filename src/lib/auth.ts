import { UserRole } from "@prisma/client";
import { getServerSession } from "next-auth";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";

interface User {
  id: string;
  role: UserRole;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  return session?.user;
}

export async function checkRole(allowedRoles: UserRole[]) {
  const user = await getCurrentUser();
  if (!user || !allowedRoles.includes(user.role)) {
    throw new Error("Not authorized");
  }
  return user;
}
