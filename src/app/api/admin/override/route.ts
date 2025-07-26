/**
 * API route for admin account access override
 * 
 * Handles admin override requests for temporarily accessing user accounts
 * for support and dispute resolution.
 */

import { NextRequest, NextResponse } from 'next/server';
import { handleOverrideRequest } from '@/features/admin/lib/override-actions';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...params } = body;
    
    const result = await handleOverrideRequest(action, params);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Admin override API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}