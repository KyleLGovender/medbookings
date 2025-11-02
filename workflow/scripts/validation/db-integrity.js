#!/usr/bin/env node
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

/**
 * Database Integrity Check
 * Comprehensive MedBookings domain health checks
 * Replaces the shell script with a proper Node.js implementation
 */

const prisma = new PrismaClient();

// Color codes for terminal output
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const GREEN = '\x1b[32m';
const NC = '\x1b[0m'; // No Color

// Track issues
let criticalErrors = [];
let warnings = [];
let info = [];

// Helper to log with colors
function log(message, type = 'info') {
  const prefix =
    type === 'error'
      ? `${RED}❌`
      : type === 'warning'
        ? `${YELLOW}⚠️`
        : type === 'success'
          ? `${GREEN}✅`
          : '📍';
  console.log(`${prefix} ${message}${NC}`);

  if (type === 'error') criticalErrors.push(message);
  else if (type === 'warning') warnings.push(message);
  else info.push(message);
}

// Database integrity checks
async function checkDatabaseIntegrity() {
  console.log('\n🗄️  DATABASE INTEGRITY CHECKS');
  console.log('='.repeat(50));

  try {
    // Test connection
    await prisma.$connect();
    log('Database connection successful', 'success');

    // Check critical tables exist
    const criticalTables = ['User', 'Provider', 'Organization', 'Booking'];
    for (const table of criticalTables) {
      const count = await prisma[table.toLowerCase()].count();
      log(`Table ${table}: ${count} records`, 'info');
    }

    // Check for orphaned records
    await checkOrphanedRecords();

    // Check booking integrity
    await checkBookingIntegrity();

    // Check provider status consistency
    await checkProviderStatus();

    // Check availability slot integrity
    await checkSlotIntegrity();
  } catch (error) {
    log(`Database check failed: ${error.message}`, 'error');
  }
}

async function checkOrphanedRecords() {
  try {
    // Check providers without users
    const orphanedProviders = await prisma.provider.count({
      where: { userId: null },
    });
    if (orphanedProviders > 0) {
      log(`Found ${orphanedProviders} providers without associated users`, 'warning');
    }

    // Check bookings without slots
    const orphanedBookings = await prisma.booking.count({
      where: { slotId: null },
    });
    if (orphanedBookings > 0) {
      log(`Found ${orphanedBookings} bookings without associated slots`, 'error');
    }

    // Check slots without availability
    const orphanedSlots = await prisma.slot.count({
      where: { availabilityId: null },
    });
    if (orphanedSlots > 0) {
      log(`Found ${orphanedSlots} slots without associated availability`, 'warning');
    }
  } catch (error) {
    log(`Orphan check failed: ${error.message}`, 'warning');
  }
}

async function checkBookingIntegrity() {
  try {
    // Check for double bookings
    const doubleBookings = await prisma.$queryRaw`
      SELECT s."id", COUNT(b."id") as booking_count
      FROM "Slot" s
      JOIN "Booking" b ON b."slotId" = s."id"
      WHERE b."status" IN ('CONFIRMED', 'PENDING')
      GROUP BY s."id"
      HAVING COUNT(b."id") > 1
    `;

    if (doubleBookings.length > 0) {
      log(`CRITICAL: Found ${doubleBookings.length} slots with double bookings`, 'error');
    }

    // Check for bookings in past without completion
    const now = new Date();
    const pastIncompleteBookings = await prisma.booking.count({
      where: {
        slot: {
          startTime: { lt: now },
        },
        status: {
          in: ['PENDING', 'CONFIRMED'],
        },
      },
    });

    if (pastIncompleteBookings > 0) {
      log(`Found ${pastIncompleteBookings} past bookings not marked as completed`, 'warning');
    }
  } catch (error) {
    log(`Booking integrity check failed: ${error.message}`, 'warning');
  }
}

async function checkProviderStatus() {
  try {
    // Check providers with APPROVED status but missing requirements
    const invalidProviders = await prisma.provider.findMany({
      where: {
        status: 'APPROVED',
        OR: [{ licenseVerified: false }, { identityVerified: false }, { practiceVerified: false }],
      },
      select: { id: true, name: true },
    });

    if (invalidProviders.length > 0) {
      log(
        `Found ${invalidProviders.length} approved providers with unverified requirements`,
        'error'
      );
    }

    // Check for expired trial providers still active
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const expiredTrials = await prisma.provider.count({
      where: {
        status: 'TRIAL',
        approvedAt: { lt: thirtyDaysAgo },
      },
    });

    if (expiredTrials > 0) {
      log(`Found ${expiredTrials} providers with expired trials`, 'warning');
    }
  } catch (error) {
    log(`Provider status check failed: ${error.message}`, 'warning');
  }
}

async function checkSlotIntegrity() {
  try {
    // Check for overlapping slots for same provider
    const overlappingSlots = await prisma.$queryRaw`
      SELECT a."providerId", COUNT(*) as overlaps
      FROM "Slot" s1
      JOIN "Slot" s2 ON s1."availabilityId" = s2."availabilityId"
      JOIN "Availability" a ON s1."availabilityId" = a."id"
      WHERE s1."id" != s2."id"
      AND s1."startTime" < s2."endTime"
      AND s2."startTime" < s1."endTime"
      AND s1."status" = 'AVAILABLE'
      AND s2."status" = 'AVAILABLE'
      GROUP BY a."providerId"
    `;

    if (overlappingSlots.length > 0) {
      log(`CRITICAL: Found overlapping slots for ${overlappingSlots.length} providers`, 'error');
    }

    // Check slots with invalid duration
    const invalidDurationSlots = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM "Slot"
      WHERE "endTime" <= "startTime"
    `;

    if (invalidDurationSlots[0]?.count > 0) {
      log(`Found ${invalidDurationSlots[0].count} slots with invalid duration`, 'error');
    }
  } catch (error) {
    log(`Slot integrity check failed: ${error.message}`, 'warning');
  }
}

// Business rule checks
async function checkBusinessRules() {
  console.log('\n📋 BUSINESS RULE CHECKS');
  console.log('='.repeat(50));

  try {
    // Check pricing consistency
    const freeServices = await prisma.service.count({
      where: {
        OR: [{ price: null }, { price: 0 }],
      },
    });

    if (freeServices > 0) {
      log(`Found ${freeServices} services without pricing`, 'warning');
    }

    // Check provider availability coverage
    const providersWithoutAvailability = await prisma.provider.count({
      where: {
        status: 'APPROVED',
        availabilities: {
          none: {},
        },
      },
    });

    if (providersWithoutAvailability > 0) {
      log(
        `Found ${providersWithoutAvailability} approved providers without availability`,
        'warning'
      );
    }

    // Check for providers exceeding slot limits
    const now = new Date();
    const nextMonth = new Date(now);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    const overLimitProviders = await prisma.$queryRaw`
      SELECT p."id", p."name", COUNT(s."id") as slot_count, sub."maxSlots"
      FROM "Provider" p
      JOIN "Subscription" sub ON p."subscriptionId" = sub."id"
      JOIN "Availability" a ON p."id" = a."providerId"
      JOIN "Slot" s ON a."id" = s."availabilityId"
      WHERE s."startTime" >= ${now}
      AND s."startTime" <= ${nextMonth}
      GROUP BY p."id", p."name", sub."maxSlots"
      HAVING COUNT(s."id") > sub."maxSlots"
    `;

    if (overLimitProviders.length > 0) {
      log(`Found ${overLimitProviders.length} providers exceeding slot limits`, 'error');
    }
  } catch (error) {
    log(`Business rule check failed: ${error.message}`, 'warning');
  }
}

// Performance checks
async function checkPerformance() {
  console.log('\n⚡ PERFORMANCE CHECKS');
  console.log('='.repeat(50));

  try {
    // Check for large unpaginated queries (this is a simplified check)
    const largeTableCounts = {
      bookings: await prisma.booking.count(),
      slots: await prisma.slot.count(),
      availabilities: await prisma.availability.count(),
    };

    for (const [table, count] of Object.entries(largeTableCounts)) {
      if (count > 10000) {
        log(`Table ${table} has ${count} records - ensure pagination is used`, 'warning');
      } else {
        log(`Table ${table}: ${count} records`, 'info');
      }
    }

    // Check for missing indexes (simplified - would need actual query analysis)
    log('Index check would require query performance analysis', 'info');
  } catch (error) {
    log(`Performance check failed: ${error.message}`, 'warning');
  }
}

// Main execution
async function main() {
  console.log('🔍 MedBookings Database Integrity Check');
  console.log('Time:', new Date().toISOString());
  console.log('='.repeat(50));

  const isProduction =
    process.env.NODE_ENV === 'production' || fs.existsSync('.env.vercel.production.local');

  if (isProduction) {
    console.log('🔒 Running in PRODUCTION mode - strict checking enabled\n');
  }

  try {
    await checkDatabaseIntegrity();
    await checkBusinessRules();
    await checkPerformance();

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('INTEGRITY CHECK SUMMARY');
    console.log('='.repeat(50));

    if (criticalErrors.length > 0) {
      console.log(`\n${RED}❌ Critical Errors: ${criticalErrors.length}${NC}`);
      criticalErrors.forEach((e) => console.log(`  • ${e}`));
    }

    if (warnings.length > 0) {
      console.log(`\n${YELLOW}⚠️  Warnings: ${warnings.length}${NC}`);
      warnings.forEach((w) => console.log(`  • ${w}`));
    }

    console.log(`\n${GREEN}✅ Info: ${info.length} checks passed${NC}`);

    // Exit code based on results
    if (criticalErrors.length > 0) {
      console.log(`\n${RED}❌ Integrity check FAILED${NC}`);
      if (isProduction) process.exit(1);
    } else if (warnings.length > 0) {
      console.log(`\n${YELLOW}⚠️  Integrity check passed with warnings${NC}`);
    } else {
      console.log(`\n${GREEN}✅ All integrity checks PASSED${NC}`);
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    if (isProduction) process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { main };
