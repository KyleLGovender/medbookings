import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for subscription creation
const createSubscriptionSchema = z.object({
  planId: z.string().min(1, 'Plan ID is required'),
  // Polymorphic relationship - exactly one must be provided
  organizationId: z.string().optional(),
  locationId: z.string().optional(), 
  providerId: z.string().optional(),
  // Subscription details
  type: z.enum(['BASE', 'WEBSITE_HOSTING', 'REVIEW_PROMOTION', 'PREMIUM_ANALYTICS', 'CUSTOM']).default('BASE'),
  status: z.enum(['ACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED', 'TRIALING']),
  startDate: z.string().transform((val) => new Date(val)),
  endDate: z.string().transform((val) => new Date(val)).optional(),
  // Stripe integration
  stripeCustomerId: z.string().optional(),
  stripeSubscriptionId: z.string().optional(),
}).refine((data) => {
  // Ensure exactly one of the polymorphic fields is set
  const setFields = [data.organizationId, data.locationId, data.providerId].filter(Boolean);
  return setFields.length === 1;
}, {
  message: "Exactly one of organizationId, locationId, or providerId must be provided",
  path: ["polymorphicRelation"]
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = createSubscriptionSchema.parse(body);

    // Additional validation: Check that the referenced entity exists
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

    if (validatedData.providerId) {
      const provider = await prisma.provider.findUnique({
        where: { id: validatedData.providerId }
      });
      if (!provider) {
        return NextResponse.json(
          { error: 'Service provider not found' },
          { status: 404 }
        );
      }
    }

    // Check that the plan exists
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: validatedData.planId }
    });
    if (!plan) {
      return NextResponse.json(
        { error: 'Subscription plan not found' },
        { status: 404 }
      );
    }

    // Create the subscription
    const subscription = await prisma.subscription.create({
      data: {
        planId: validatedData.planId,
        organizationId: validatedData.organizationId,
        locationId: validatedData.locationId,
        providerId: validatedData.providerId,
        type: validatedData.type,
        status: validatedData.status,
        startDate: validatedData.startDate,
        endDate: validatedData.endDate,
        stripeCustomerId: validatedData.stripeCustomerId,
        stripeSubscriptionId: validatedData.stripeSubscriptionId,
        billingCycleStart: validatedData.startDate,
        billingCycleEnd: new Date(validatedData.startDate.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days
        currentMonthSlots: 0,
      },
      include: {
        plan: true,
        organization: true,
        location: true,
        provider: true,
      }
    });

    return NextResponse.json({ subscription }, { status: 201 });

  } catch (error) {
    console.error('Error creating subscription:', error);
    
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

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const locationId = searchParams.get('locationId');
    const providerId = searchParams.get('providerId');

    // Build where clause based on provided filters
    const whereClause: any = {};
    
    if (organizationId) {
      whereClause.organizationId = organizationId;
    }
    if (locationId) {
      whereClause.locationId = locationId;
    }
    if (providerId) {
      whereClause.providerId = providerId;
    }

    const subscriptions = await prisma.subscription.findMany({
      where: whereClause,
      include: {
        plan: true,
        organization: true,
        location: true,
        provider: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ subscriptions });

  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}