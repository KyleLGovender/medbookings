import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for subscription updates
const updateSubscriptionSchema = z.object({
  planId: z.string().min(1, 'Plan ID is required').optional(),
  // Polymorphic relationship - exactly one must be provided if updating
  organizationId: z.string().optional(),
  locationId: z.string().optional(), 
  serviceProviderId: z.string().optional(),
  // Subscription details
  type: z.enum(['BASE', 'WEBSITE_HOSTING', 'REVIEW_PROMOTION', 'PREMIUM_ANALYTICS', 'CUSTOM']).optional(),
  status: z.enum(['ACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED', 'TRIALING']).optional(),
  startDate: z.string().transform((val) => new Date(val)).optional(),
  endDate: z.string().transform((val) => new Date(val)).optional(),
  cancelledAt: z.string().transform((val) => new Date(val)).optional(),
  cancelReason: z.string().optional(),
  // Stripe integration
  stripeCustomerId: z.string().optional(),
  stripeSubscriptionId: z.string().optional(),
}).refine((data) => {
  // If any polymorphic field is being updated, ensure exactly one is set
  const polymorphicFields = [data.organizationId, data.locationId, data.serviceProviderId];
  const definedFields = polymorphicFields.filter(field => field !== undefined);
  
  // If no polymorphic fields are being updated, that's fine
  if (definedFields.length === 0) {
    return true;
  }
  
  // If polymorphic fields are being updated, exactly one must be set (not null)
  const setFields = polymorphicFields.filter(field => field !== undefined && field !== null);
  return setFields.length === 1;
}, {
  message: "If updating entity relationship, exactly one of organizationId, locationId, or serviceProviderId must be provided",
  path: ["polymorphicRelation"]
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const subscription = await prisma.subscription.findUnique({
      where: { id: params.id },
      include: {
        plan: true,
        organization: true,
        location: true,
        serviceProvider: true,
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        usageRecords: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ subscription });

  } catch (error) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if subscription exists
    const existingSubscription = await prisma.subscription.findUnique({
      where: { id: params.id }
    });

    if (!existingSubscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = updateSubscriptionSchema.parse(body);

    // Additional validation: Check that referenced entities exist
    if (validatedData.organizationId) {
      const organization = await prisma.organization.findUnique({
        where: { id: validatedData.organizationId }
      });
      if (!organization) {
        return NextResponse.json(
          { error: 'Organization not found' },
          { status: 404 }
        );
      }
    }

    if (validatedData.locationId) {
      const location = await prisma.location.findUnique({
        where: { id: validatedData.locationId }
      });
      if (!location) {
        return NextResponse.json(
          { error: 'Location not found' },
          { status: 404 }
        );
      }
    }

    if (validatedData.serviceProviderId) {
      const serviceProvider = await prisma.serviceProvider.findUnique({
        where: { id: validatedData.serviceProviderId }
      });
      if (!serviceProvider) {
        return NextResponse.json(
          { error: 'Service provider not found' },
          { status: 404 }
        );
      }
    }

    if (validatedData.planId) {
      const plan = await prisma.subscriptionPlan.findUnique({
        where: { id: validatedData.planId }
      });
      if (!plan) {
        return NextResponse.json(
          { error: 'Subscription plan not found' },
          { status: 404 }
        );
      }
    }

    // Handle polymorphic relationship updates carefully
    const updateData: any = { ...validatedData };

    // If updating the polymorphic relationship, we need to clear the other fields
    if (validatedData.organizationId !== undefined || 
        validatedData.locationId !== undefined || 
        validatedData.serviceProviderId !== undefined) {
      
      // Clear all polymorphic fields first
      updateData.organizationId = null;
      updateData.locationId = null;
      updateData.serviceProviderId = null;
      
      // Then set the one that was provided
      if (validatedData.organizationId) {
        updateData.organizationId = validatedData.organizationId;
      } else if (validatedData.locationId) {
        updateData.locationId = validatedData.locationId;
      } else if (validatedData.serviceProviderId) {
        updateData.serviceProviderId = validatedData.serviceProviderId;
      }
    }

    // Update the subscription
    const updatedSubscription = await prisma.subscription.update({
      where: { id: params.id },
      data: updateData,
      include: {
        plan: true,
        organization: true,
        location: true,
        serviceProvider: true,
      }
    });

    return NextResponse.json({ subscription: updatedSubscription });

  } catch (error) {
    console.error('Error updating subscription:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: error.errors
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if subscription exists
    const existingSubscription = await prisma.subscription.findUnique({
      where: { id: params.id }
    });

    if (!existingSubscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    // Instead of hard delete, mark as cancelled
    const cancelledSubscription = await prisma.subscription.update({
      where: { id: params.id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancelReason: 'Cancelled via API'
      },
      include: {
        plan: true,
        organization: true,
        location: true,
        serviceProvider: true,
      }
    });

    return NextResponse.json({ subscription: cancelledSubscription });

  } catch (error) {
    console.error('Error cancelling subscription:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}