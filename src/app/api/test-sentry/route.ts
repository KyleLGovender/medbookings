import { NextResponse } from 'next/server';

export async function GET() {
  // Test error for Sentry source map verification
  // TODO: DELETE THIS FILE AFTER TESTING
  throw new Error('Sentry source map test - this error is intentional');
}
