import { NextRequest } from 'next/server';

import { getToken } from 'next-auth/jwt';

import { prisma } from '@/lib/prisma';

export async function PUT(req: NextRequest) {
  const token = await getToken({ req });
  if (!token) {
    return new Response('Unauthorized', { status: 401 });
  }

  const provider = await prisma.provider.findFirst({
    where: { userId: token.sub },
    include: { calendarIntegration: true },
  });

  if (!provider?.calendarIntegration) {
    return new Response('No calendar integration found', { status: 404 });
  }

  const meetSettings = await req.json();

  await prisma.calendarIntegration.update({
    where: { id: provider.calendarIntegration.id },
    data: { meetSettings },
  });

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
