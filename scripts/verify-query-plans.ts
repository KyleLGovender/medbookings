/**
 * Script to verify query execution plans are optimal using EXPLAIN ANALYZE
 * Tests the indexed queries for provider search functionality
 */
import { prisma } from '../src/lib/prisma';

interface QueryPlan {
  queryName: string;
  query: string;
  plan: any[];
}

async function analyzeQuery(queryName: string, query: string): Promise<QueryPlan> {
  console.log(`\n🔍 Analyzing: ${queryName}`);
  console.log('Query:', query);

  const result = await prisma.$queryRawUnsafe(`EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${query}`);
  const plan = (result as any)[0]['QUERY PLAN'];

  console.log('✅ Query analyzed successfully');

  return {
    queryName,
    query,
    plan,
  };
}

async function checkIndexUsage(plan: any, expectedIndexes: string[]): Promise<void> {
  const planStr = JSON.stringify(plan);

  console.log('\n📊 Index Usage Analysis:');
  expectedIndexes.forEach((indexName) => {
    if (planStr.includes(indexName)) {
      console.log(`   ✅ Using index: ${indexName}`);
    } else {
      console.log(`   ❌ NOT using index: ${indexName}`);
    }
  });
}

async function analyzeCostAndTime(plan: any): Promise<void> {
  const planNode = plan[0]?.Plan;
  if (planNode) {
    console.log('\n⏱️  Performance Metrics:');
    console.log(`   - Total Cost: ${planNode['Total Cost']}`);
    console.log(`   - Actual Time: ${planNode['Actual Total Time']}ms`);
    console.log(`   - Rows: ${planNode['Actual Rows']}`);

    if (planNode['Actual Total Time'] > 100) {
      console.log('   ⚠️  Warning: Query is slow (>100ms)');
    } else if (planNode['Actual Total Time'] < 10) {
      console.log('   ✅ Query is fast (<10ms)');
    }
  }
}

async function verifyQueryPlans() {
  console.log('🚀 Starting Query Plan Verification');
  console.log('='.repeat(60));

  // Get sample data for realistic queries
  const sampleProvider = await prisma.provider.findFirst();
  const sampleType = await prisma.providerType.findFirst();

  if (!sampleProvider || !sampleType) {
    console.log('❌ No sample data available for testing');
    return;
  }

  const queries: QueryPlan[] = [];

  // Query 1: Basic provider search with type filter (should use index)
  const query1 = `
    SELECT sp.id, sp.name, sp.email 
    FROM "Provider" sp
    JOIN "ProviderTypeAssignment" spa ON sp.id = spa."providerId"
    WHERE spa."providerTypeId" = '${sampleType.id}'
    AND sp.status = 'APPROVED'
    ORDER BY sp.name
    LIMIT 50
  `;

  const plan1 = await analyzeQuery('Provider search with type filter', query1);
  queries.push(plan1);

  await checkIndexUsage(plan1.plan, [
    'ProviderTypeAssignment_providerTypeId_idx',
    'ProviderTypeAssignment_providerId_idx',
  ]);
  await analyzeCostAndTime(plan1.plan);

  // Query 2: Provider type statistics (should use index)
  const query2 = `
    SELECT spa."providerTypeId", COUNT(DISTINCT spa."providerId") as provider_count
    FROM "ProviderTypeAssignment" spa
    JOIN "Provider" sp ON spa."providerId" = sp.id
    WHERE sp.status = 'APPROVED'
    GROUP BY spa."providerTypeId"
  `;

  const plan2 = await analyzeQuery('Provider type statistics', query2);
  queries.push(plan2);

  await checkIndexUsage(plan2.plan, ['ProviderTypeAssignment_providerId_idx']);
  await analyzeCostAndTime(plan2.plan);

  // Query 3: Complex search with multiple conditions
  const query3 = `
    SELECT DISTINCT sp.id, sp.name, sp.email 
    FROM "Provider" sp
    JOIN "ProviderTypeAssignment" spa ON sp.id = spa."providerId"
    LEFT JOIN "User" u ON sp."userId" = u.id
    WHERE sp.status = 'APPROVED'
    AND (sp.name ILIKE '%Dr%' OR u.email ILIKE '%Dr%' OR sp.bio ILIKE '%Dr%')
    AND spa."providerTypeId" IN ('${sampleType.id}')
    ORDER BY sp.name
    LIMIT 50
  `;

  const plan3 = await analyzeQuery('Complex search with text and type filters', query3);
  queries.push(plan3);

  await checkIndexUsage(plan3.plan, ['ProviderTypeAssignment_providerTypeId_idx']);
  await analyzeCostAndTime(plan3.plan);

  // Query 4: Fast provider lookup by assignment (should be very fast with composite index)
  const query4 = `
    SELECT spa.*
    FROM "ProviderTypeAssignment" spa
    WHERE spa."providerId" = '${sampleProvider.id}'
    AND spa."providerTypeId" = '${sampleType.id}'
  `;

  const plan4 = await analyzeQuery('Fast assignment lookup', query4);
  queries.push(plan4);

  await checkIndexUsage(plan4.plan, ['ProviderTypeAssignment_providerId_providerTypeId_idx']);
  await analyzeCostAndTime(plan4.plan);

  // Query 5: Count query for pagination (should use index)
  const query5 = `
    SELECT COUNT(DISTINCT sp.id)
    FROM "Provider" sp
    JOIN "ProviderTypeAssignment" spa ON sp.id = spa."providerId"
    WHERE sp.status = 'APPROVED'
    AND spa."providerTypeId" = '${sampleType.id}'
  `;

  const plan5 = await analyzeQuery('Count query for pagination', query5);
  queries.push(plan5);

  await checkIndexUsage(plan5.plan, ['ProviderTypeAssignment_providerTypeId_idx']);
  await analyzeCostAndTime(plan5.plan);

  // Summary
  console.log('\n');
  console.log('📊 Query Plan Summary');
  console.log('='.repeat(60));

  const slowQueries = queries.filter((q) => {
    const planNode = q.plan[0]?.Plan;
    return planNode && planNode['Actual Total Time'] > 100;
  });

  const fastQueries = queries.filter((q) => {
    const planNode = q.plan[0]?.Plan;
    return planNode && planNode['Actual Total Time'] < 10;
  });

  console.log(`✅ Fast queries (<10ms): ${fastQueries.length}`);
  console.log(`⚠️  Slow queries (>100ms): ${slowQueries.length}`);

  if (slowQueries.length > 0) {
    console.log('\nSlow queries that need optimization:');
    slowQueries.forEach((q) => {
      const time = q.plan[0]?.Plan?.['Actual Total Time'];
      console.log(`   - ${q.queryName}: ${time}ms`);
    });
  }

  // Check for common performance issues
  console.log('\n🔍 Performance Issues Check:');
  queries.forEach((q) => {
    const planStr = JSON.stringify(q.plan);

    if (planStr.includes('Seq Scan')) {
      console.log(`   ⚠️  ${q.queryName}: Contains sequential scan (may need index)`);
    }

    if (planStr.includes('Hash Join') && planStr.includes('large')) {
      console.log(`   ⚠️  ${q.queryName}: Large hash join detected`);
    }

    if (planStr.includes('Sort') && !planStr.includes('Index')) {
      console.log(`   ⚠️  ${q.queryName}: Sorting without index`);
    }
  });

  console.log('\n✅ Query plan verification completed!');
}

// Run the query plan verification
verifyQueryPlans()
  .catch(console.error)
  .finally(() => process.exit(0));
