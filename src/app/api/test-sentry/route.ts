import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // Prevent static optimization

export async function GET() {
  // Delay the error throw to ensure it only happens at runtime
  await new Promise((resolve) => setTimeout(resolve, 0));

  // Test error for Sentry source map verification
  // TODO: DELETE THIS FILE AFTER TESTING
  throw new Error('Sentry source map test - this error is intentional');
}
