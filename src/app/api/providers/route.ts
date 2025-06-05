import { NextRequest, NextResponse } from 'next/server';

import { getServerSession } from 'next-auth';

import { registerServiceProvider } from '@/features/providers/lib/actions';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user?.id) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Parse request body
    const data = await request.json();

    // Convert the JSON data to FormData format for the service layer
    const formData = new FormData();

    // Add user ID
    formData.append('userId', user.id);

    // Add basic info fields
    formData.append('name', data.basicInfo.name);
    formData.append('bio', data.basicInfo.bio || '');
    formData.append('email', data.basicInfo.email);
    formData.append('whatsapp', data.basicInfo.whatsapp || '');
    if (data.basicInfo.website) {
      formData.append('website', data.basicInfo.website);
    }

    // Add image if exists (note: for actual file uploads, this would be handled differently)
    if (data.basicInfo.image) {
      // In a real implementation, you'd convert base64 to File or handle the image upload
      // formData.append('image', data.basicInfo.image);
    }

    // Add provider type
    formData.append('serviceProviderTypeId', data.providerType.providerType);

    // Add languages
    if (data.basicInfo.languages && Array.isArray(data.basicInfo.languages)) {
      data.basicInfo.languages.forEach((lang: string) => {
        formData.append('languages', lang);
      });
    }

    // Add services
    if (data.services?.availableServices && Array.isArray(data.services.availableServices)) {
      data.services.availableServices.forEach((serviceId: string) => {
        formData.append('services', serviceId);

        // Add service configs if available
        if (data.services.serviceConfigs && data.services.serviceConfigs[serviceId]) {
          const config = data.services.serviceConfigs[serviceId];
          if (config.duration) {
            formData.append(`serviceConfigs[${serviceId}][duration]`, config.duration.toString());
          }
          if (config.price) {
            formData.append(`serviceConfigs[${serviceId}][price]`, config.price.toString());
          }
        }
      });
    }

    // Add requirements
    if (
      data.regulatoryRequirements?.requirements &&
      Array.isArray(data.regulatoryRequirements.requirements)
    ) {
      data.regulatoryRequirements.requirements.forEach((req: any, index: number) => {
        formData.append(`requirements[${index}][requirementTypeId]`, req.requirementTypeId);
        if (req.value) {
          formData.append(`requirements[${index}][value]`, req.value);
        }
        // Note: For file uploads, this would be handled differently
        if (req.documentFile && req.documentFile.url) {
          // Here we're just storing the URL since we can't convert back to a File object
          formData.append(`requirements[${index}][otherValue]`, req.documentFile.url);
          formData.append(`requirements[${index}][value]`, 'other');
        }
      });
    }

    // Use the service layer function
    const result = await registerServiceProvider({}, formData);

    if (result.success) {
      return NextResponse.json({
        success: true,
        redirect: result.redirect,
      });
    } else {
      return NextResponse.json(
        { error: result.error || 'Failed to register provider' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Error creating provider:', error);

    // Return more specific error if available
    const errorMessage = error.message || 'Failed to create provider';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
