#!/usr/bin/env tsx

/**
 * Data Integrity Verification Script for Subscriptions
 * 
 * This script verifies that all existing subscriptions in the database
 * satisfy the polymorphic constraint: exactly one of organizationId, 
 * locationId, or providerId is set.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface SubscriptionIntegrityIssue {
  id: string;
  issue: string;
  organizationId: string | null;
  locationId: string | null;
  providerId: string | null;
  createdAt: Date;
}

async function verifySubscriptionIntegrity(): Promise<{
  totalSubscriptions: number;
  validSubscriptions: number;
  issues: SubscriptionIntegrityIssue[];
}> {
  console.log('🔍 Starting subscription integrity verification...\n');

  try {
    // Fetch all subscriptions
    const subscriptions = await prisma.subscription.findMany({
      select: {
        id: true,
        organizationId: true,
        locationId: true,
        providerId: true,
        createdAt: true,
      }
    });

    console.log(`📊 Found ${subscriptions.length} total subscriptions`);

    const issues: SubscriptionIntegrityIssue[] = [];
    let validSubscriptions = 0;

    // Check each subscription for integrity issues
    for (const subscription of subscriptions) {
      const setFields = [
        subscription.organizationId,
        subscription.locationId,
        subscription.providerId
      ].filter(Boolean);

      if (setFields.length === 0) {
        // No entity assigned
        issues.push({
          id: subscription.id,
          issue: 'No entity assigned (orphaned subscription)',
          organizationId: subscription.organizationId,
          locationId: subscription.locationId,
          providerId: subscription.providerId,
          createdAt: subscription.createdAt,
        });
      } else if (setFields.length > 1) {
        // Multiple entities assigned
        issues.push({
          id: subscription.id,
          issue: 'Multiple entities assigned (violates polymorphic constraint)',
          organizationId: subscription.organizationId,
          locationId: subscription.locationId,
          providerId: subscription.providerId,
          createdAt: subscription.createdAt,
        });
      } else {
        // Exactly one entity assigned - valid
        validSubscriptions++;
      }
    }

    return {
      totalSubscriptions: subscriptions.length,
      validSubscriptions,
      issues,
    };

  } catch (error) {
    console.error('❌ Error during verification:', error);
    throw error;
  }
}

async function validateReferencedEntities(): Promise<{
  invalidOrganizations: string[];
  invalidLocations: string[];
  invalidProviders: string[];
}> {
  console.log('🔗 Verifying referenced entity existence...\n');

  const invalidOrganizations: string[] = [];
  const invalidLocations: string[] = [];
  const invalidProviders: string[] = [];

  try {
    // Check organization references
    const subscriptionsWithOrganizations = await prisma.subscription.findMany({
      where: { organizationId: { not: null } },
      select: { id: true, organizationId: true }
    });

    for (const sub of subscriptionsWithOrganizations) {
      if (sub.organizationId) {
        const org = await prisma.organization.findUnique({
          where: { id: sub.organizationId }
        });
        if (!org) {
          invalidOrganizations.push(sub.id);
        }
      }
    }

    // Check location references
    const subscriptionsWithLocations = await prisma.subscription.findMany({
      where: { locationId: { not: null } },
      select: { id: true, locationId: true }
    });

    for (const sub of subscriptionsWithLocations) {
      if (sub.locationId) {
        const location = await prisma.location.findUnique({
          where: { id: sub.locationId }
        });
        if (!location) {
          invalidLocations.push(sub.id);
        }
      }
    }

    // Check service provider references
    const subscriptionsWithProviders = await prisma.subscription.findMany({
      where: { providerId: { not: null } },
      select: { id: true, providerId: true }
    });

    for (const sub of subscriptionsWithProviders) {
      if (sub.providerId) {
        const provider = await prisma.provider.findUnique({
          where: { id: sub.providerId }
        });
        if (!provider) {
          invalidProviders.push(sub.id);
        }
      }
    }

    return {
      invalidOrganizations,
      invalidLocations,
      invalidProviders,
    };

  } catch (error) {
    console.error('❌ Error during entity validation:', error);
    throw error;
  }
}

async function generateReport(
  integrityResults: Awaited<ReturnType<typeof verifySubscriptionIntegrity>>,
  entityResults: Awaited<ReturnType<typeof validateReferencedEntities>>
): Promise<void> {
  console.log('\n📋 SUBSCRIPTION INTEGRITY REPORT');
  console.log('=' .repeat(50));

  // Summary
  console.log(`\n📊 SUMMARY:`);
  console.log(`Total Subscriptions: ${integrityResults.totalSubscriptions}`);
  console.log(`Valid Subscriptions: ${integrityResults.validSubscriptions}`);
  console.log(`Integrity Issues: ${integrityResults.issues.length}`);
  console.log(`Invalid References: ${entityResults.invalidOrganizations.length + entityResults.invalidLocations.length + entityResults.invalidProviders.length}`);

  // Constraint violations
  if (integrityResults.issues.length > 0) {
    console.log(`\n❌ POLYMORPHIC CONSTRAINT VIOLATIONS:`);
    for (const issue of integrityResults.issues) {
      console.log(`\nSubscription ID: ${issue.id}`);
      console.log(`Issue: ${issue.issue}`);
      console.log(`Organization ID: ${issue.organizationId || 'null'}`);
      console.log(`Location ID: ${issue.locationId || 'null'}`);
      console.log(`Service Provider ID: ${issue.providerId || 'null'}`);
      console.log(`Created: ${issue.createdAt.toISOString()}`);
    }
  }

  // Entity reference issues
  if (entityResults.invalidOrganizations.length > 0) {
    console.log(`\n❌ INVALID ORGANIZATION REFERENCES:`);
    entityResults.invalidOrganizations.forEach(id => 
      console.log(`Subscription ${id} references non-existent organization`)
    );
  }

  if (entityResults.invalidLocations.length > 0) {
    console.log(`\n❌ INVALID LOCATION REFERENCES:`);
    entityResults.invalidLocations.forEach(id => 
      console.log(`Subscription ${id} references non-existent location`)
    );
  }

  if (entityResults.invalidProviders.length > 0) {
    console.log(`\n❌ INVALID PROVIDER REFERENCES:`);
    entityResults.invalidProviders.forEach(id => 
      console.log(`Subscription ${id} references non-existent service provider`)
    );
  }

  // Success message
  const totalIssues = integrityResults.issues.length + 
                     entityResults.invalidOrganizations.length + 
                     entityResults.invalidLocations.length + 
                     entityResults.invalidProviders.length;

  if (totalIssues === 0) {
    console.log(`\n✅ ALL SUBSCRIPTIONS PASS INTEGRITY CHECKS!`);
    console.log(`All ${integrityResults.totalSubscriptions} subscriptions satisfy the polymorphic constraint.`);
  } else {
    console.log(`\n⚠️  INTEGRITY ISSUES FOUND: ${totalIssues}`);
    console.log(`Please review and fix these issues before applying the database constraint.`);
  }

  console.log('\n' + '=' .repeat(50));
}

async function main(): Promise<void> {
  try {
    console.log('🚀 Subscription Integrity Verification Script');
    console.log('   Checking polymorphic constraint compliance...\n');

    // Run verification checks
    const integrityResults = await verifySubscriptionIntegrity();
    const entityResults = await validateReferencedEntities();

    // Generate and display report
    await generateReport(integrityResults, entityResults);

    // Exit with appropriate code
    const totalIssues = integrityResults.issues.length + 
                       entityResults.invalidOrganizations.length + 
                       entityResults.invalidLocations.length + 
                       entityResults.invalidProviders.length;

    if (totalIssues > 0) {
      console.log('\n❌ Script completed with issues found');
      process.exit(1);
    } else {
      console.log('\n✅ Script completed successfully');
      process.exit(0);
    }

  } catch (error) {
    console.error('\n💥 Script failed with error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script if executed directly
if (require.main === module) {
  main();
}

export { verifySubscriptionIntegrity, validateReferencedEntities };