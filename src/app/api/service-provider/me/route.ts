import { NextResponse } from 'next/server';

import { getAuthenticatedServiceProvider } from '@/lib/server-helper';

export async function GET() {
  const result = await getAuthenticatedServiceProvider();
  return NextResponse.json(result);
}
