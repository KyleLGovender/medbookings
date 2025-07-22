/**
 * Performance testing script for provider search with realistic data volumes
 * Tests the optimized search queries and caching implementation
 */
import {
  getProviderTypeStats,
  getProvidersByType,
  searchProviders,
} from '../src/features/providers/lib/search';
import { prisma } from '../src/lib/prisma';

interface PerformanceResult {
  operation: string;
  duration: number;
  recordCount: number;
  averageTime: number;
}

async function measurePerformance<T>(
  operation: string,
  fn: () => Promise<T>,
  iterations = 1
): Promise<PerformanceResult> {
  const times: number[] = [];
  let result: T | null = null;

  for (let i = 0; i < iterations; i++) {
    const start = process.hrtime.bigint();
    result = await fn();
    const end = process.hrtime.bigint();

    const duration = Number(end - start) / 1_000_000; // Convert to milliseconds
    times.push(duration);
  }

  const totalTime = times.reduce((sum, time) => sum + time, 0);
  const avgTime = totalTime / iterations;

  // Try to get record count if result is an array or has pagination
  let recordCount = 0;
  if (Array.isArray(result)) {
    recordCount = result.length;
  } else if (result && typeof result === 'object' && 'providers' in result) {
    recordCount = (result as any).providers.length;
  }

  return {
    operation,
    duration: totalTime,
    recordCount,
    averageTime: avgTime,
  };
}

async function performanceTestProviderSearch() {
  console.log('🚀 Starting Provider Search Performance Tests');
  console.log('='.repeat(60));

  // Get current database stats
  const totalProviders = await prisma.provider.count();
  const totalAssignments = await prisma.providerTypeAssignment.count();
  const totalTypes = await prisma.providerType.count();

  console.log('📊 Database Stats:');
  console.log(`   - Total Providers: ${totalProviders}`);
  console.log(`   - Total Type Assignments: ${totalAssignments}`);
  console.log(`   - Total Provider Types: ${totalTypes}`);
  console.log('');

  const results: PerformanceResult[] = [];

  // Test 1: Basic search without filters
  console.log('🔍 Test 1: Basic search without filters');
  const test1 = await measurePerformance(
    'Basic search (no filters)',
    () => searchProviders({ limit: 50, offset: 0 }),
    5
  );
  results.push(test1);
  console.log(`   ⏱️  Average: ${test1.averageTime.toFixed(2)}ms | Records: ${test1.recordCount}`);

  // Test 2: Search with text filter
  console.log('🔍 Test 2: Search with text filter');
  const test2 = await measurePerformance(
    'Text search',
    () => searchProviders({ search: 'Dr', limit: 50, offset: 0 }),
    5
  );
  results.push(test2);
  console.log(`   ⏱️  Average: ${test2.averageTime.toFixed(2)}ms | Records: ${test2.recordCount}`);

  // Test 3: Search with single type filter
  console.log('🔍 Test 3: Search with single type filter');
  const typeIds = await prisma.providerType.findMany({ select: { id: true }, take: 1 });
  if (typeIds.length > 0) {
    const test3 = await measurePerformance(
      'Single type filter',
      () => searchProviders({ typeIds: [typeIds[0].id], limit: 50, offset: 0 }),
      5
    );
    results.push(test3);
    console.log(
      `   ⏱️  Average: ${test3.averageTime.toFixed(2)}ms | Records: ${test3.recordCount}`
    );
  }

  // Test 4: Search with multiple type filters
  console.log('🔍 Test 4: Search with multiple type filters');
  const allTypeIds = await prisma.providerType.findMany({ select: { id: true } });
  if (allTypeIds.length > 1) {
    const multipleTypeIds = allTypeIds.slice(0, Math.min(2, allTypeIds.length)).map((t) => t.id);
    const test4 = await measurePerformance(
      'Multiple type filters',
      () => searchProviders({ typeIds: multipleTypeIds, limit: 50, offset: 0 }),
      5
    );
    results.push(test4);
    console.log(
      `   ⏱️  Average: ${test4.averageTime.toFixed(2)}ms | Records: ${test4.recordCount}`
    );
  }

  // Test 5: Complex search (text + types + status)
  console.log('🔍 Test 5: Complex search (text + types + status)');
  if (typeIds.length > 0) {
    const test5 = await measurePerformance(
      'Complex search',
      () =>
        searchProviders({
          search: 'Dr',
          typeIds: [typeIds[0].id],
          status: 'APPROVED',
          limit: 50,
          offset: 0,
        }),
      5
    );
    results.push(test5);
    console.log(
      `   ⏱️  Average: ${test5.averageTime.toFixed(2)}ms | Records: ${test5.recordCount}`
    );
  }

  // Test 6: Provider by type lookup
  console.log('🔍 Test 6: Providers by type lookup');
  if (typeIds.length > 0) {
    const test6 = await measurePerformance(
      'Providers by type',
      () => getProvidersByType(typeIds[0].id, 10),
      5
    );
    results.push(test6);
    console.log(
      `   ⏱️  Average: ${test6.averageTime.toFixed(2)}ms | Records: ${test6.recordCount}`
    );
  }

  // Test 7: Provider type statistics
  console.log('🔍 Test 7: Provider type statistics');
  const test7 = await measurePerformance('Provider type stats', () => getProviderTypeStats(), 5);
  results.push(test7);
  console.log(`   ⏱️  Average: ${test7.averageTime.toFixed(2)}ms | Records: ${test7.recordCount}`);

  // Test 8: Cached vs non-cached performance
  console.log('🔍 Test 8: Cache performance test');
  console.log('   🔄 First call (uncached):');
  const test8a = await measurePerformance('First call (uncached)', () => getProviderTypeStats(), 1);
  console.log(`      ⏱️  Time: ${test8a.averageTime.toFixed(2)}ms`);

  console.log('   ⚡ Second call (cached):');
  const test8b = await measurePerformance('Second call (cached)', () => getProviderTypeStats(), 1);
  console.log(`      ⏱️  Time: ${test8b.averageTime.toFixed(2)}ms`);
  console.log(
    `      📈 Speed improvement: ${(test8a.averageTime / test8b.averageTime).toFixed(1)}x faster`
  );

  // Test 9: Pagination performance
  console.log('🔍 Test 9: Pagination performance');
  const test9 = await measurePerformance(
    'Large offset pagination',
    () => searchProviders({ limit: 20, offset: 100 }),
    5
  );
  results.push(test9);
  console.log(`   ⏱️  Average: ${test9.averageTime.toFixed(2)}ms | Records: ${test9.recordCount}`);

  // Summary
  console.log('');
  console.log('📊 Performance Summary');
  console.log('='.repeat(60));
  console.log(`${'Operation'.padEnd(25) + 'Avg Time (ms)'.padEnd(15)}Records`);
  console.log('-'.repeat(60));

  results.forEach((result) => {
    console.log(
      result.operation.padEnd(25) + result.averageTime.toFixed(2).padEnd(15) + result.recordCount
    );
  });

  // Performance thresholds
  console.log('');
  console.log('🎯 Performance Analysis');
  console.log('='.repeat(60));

  const slowOperations = results.filter((r) => r.averageTime > 100); // > 100ms
  const fastOperations = results.filter((r) => r.averageTime <= 50); // <= 50ms

  console.log(`✅ Fast operations (≤50ms): ${fastOperations.length}`);
  console.log(`⚠️  Slow operations (>100ms): ${slowOperations.length}`);

  if (slowOperations.length > 0) {
    console.log('Slow operations:');
    slowOperations.forEach((op) => {
      console.log(`   - ${op.operation}: ${op.averageTime.toFixed(2)}ms`);
    });
  }

  console.log('');
  console.log('✅ Performance testing completed!');
}

// Run the performance tests
performanceTestProviderSearch()
  .catch(console.error)
  .finally(() => process.exit(0));
