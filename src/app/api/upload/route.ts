import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { uploadToS3 } from '@/lib/storage/s3';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;
    const directory = (formData.get('directory') as string) || 'profile-images';
    const purpose = formData.get('purpose') as string;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
    }

    if (!purpose) {
      return NextResponse.json(
        { success: false, error: 'File purpose is required' },
        { status: 400 }
      );
    }

    const result = await uploadToS3(file, userId, directory, purpose);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, url: result.url });
  } catch (error) {
    logger.error('Upload error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ success: false, error: 'Failed to upload file' }, { status: 500 });
  }
}
