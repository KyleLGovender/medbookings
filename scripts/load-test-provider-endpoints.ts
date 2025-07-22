/**
 * Load testing script for provider endpoints with concurrent requests
 * Tests performance under realistic load conditions
 */
import { performance } from 'perf_hooks';

interface LoadTestResult {
  endpoint: string;
  totalRequests: number;
  concurrentUsers: number;
  totalTime: number;
  averageTime: number;
  minTime: number;
  maxTime: number;
  requestsPerSecond: number;
  successRate: number;
  errors: string[];
}

interface RequestResult {
  success: boolean;
  time: number;
  error?: string;
}

class LoadTester {
  private baseUrl: string;

  constructor(baseUrl = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
  }

  async makeRequest(endpoint: string, params: Record<string, string> = {}): Promise<RequestResult> {
    const url = new URL(endpoint, this.baseUrl);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    const start = performance.now();

    try {
      const response = await fetch(url.toString());
      const end = performance.now();

      if (!response.ok) {
        return {
          success: false,
          time: end - start,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      await response.json(); // Parse response to ensure it's valid

      return {
        success: true,
        time: end - start,
      };
    } catch (error) {
      const end = performance.now();
      return {
        success: false,
        time: end - start,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async runConcurrentRequests(
    endpoint: string,
    params: Record<string, string>,
    concurrentUsers: number,
    requestsPerUser: number
  ): Promise<RequestResult[]> {
    const userPromises: Promise<RequestResult[]>[] = [];

    // Create concurrent users
    for (let user = 0; user < concurrentUsers; user++) {
      const userRequests = async (): Promise<RequestResult[]> => {
        const results: RequestResult[] = [];
        for (let req = 0; req < requestsPerUser; req++) {
          const result = await this.makeRequest(endpoint, params);
          results.push(result);

          // Small delay between requests from same user (100ms)
          if (req < requestsPerUser - 1) {
            await new Promise((resolve) => setTimeout(resolve, 100));
          }
        }
        return results;
      };

      userPromises.push(userRequests());
    }

    // Wait for all users to complete
    const userResults = await Promise.all(userPromises);
    return userResults.flat();
  }

  analyzeResults(
    endpoint: string,
    results: RequestResult[],
    concurrentUsers: number,
    totalTime: number
  ): LoadTestResult {
    const successfulRequests = results.filter((r) => r.success);
    const failedRequests = results.filter((r) => !r.success);

    const times = successfulRequests.map((r) => r.time);
    const errors = failedRequests.map((r) => r.error || 'Unknown error');

    return {
      endpoint,
      totalRequests: results.length,
      concurrentUsers,
      totalTime,
      averageTime: times.length > 0 ? times.reduce((sum, time) => sum + time, 0) / times.length : 0,
      minTime: times.length > 0 ? Math.min(...times) : 0,
      maxTime: times.length > 0 ? Math.max(...times) : 0,
      requestsPerSecond: results.length / (totalTime / 1000),
      successRate: (successfulRequests.length / results.length) * 100,
      errors: Array.from(new Set(errors)), // Unique errors only
    };
  }

  printResults(result: LoadTestResult): void {
    console.log(`\n🎯 ${result.endpoint}`);
    console.log('─'.repeat(50));
    console.log(`Total Requests: ${result.totalRequests}`);
    console.log(`Concurrent Users: ${result.concurrentUsers}`);
    console.log(`Success Rate: ${result.successRate.toFixed(1)}%`);
    console.log(`Requests/sec: ${result.requestsPerSecond.toFixed(1)}`);
    console.log(`Average Time: ${result.averageTime.toFixed(1)}ms`);
    console.log(`Min Time: ${result.minTime.toFixed(1)}ms`);
    console.log(`Max Time: ${result.maxTime.toFixed(1)}ms`);

    if (result.errors.length > 0) {
      console.log(`❌ Errors: ${result.errors.join(', ')}`);
    }

    // Performance assessment
    if (result.successRate < 95) {
      console.log('⚠️  Warning: Low success rate');
    }
    if (result.averageTime > 500) {
      console.log('⚠️  Warning: High average response time');
    }
    if (result.requestsPerSecond < 10) {
      console.log('⚠️  Warning: Low throughput');
    }
  }
}

async function runLoadTests() {
  console.log('🚀 Starting Load Testing for Provider Endpoints');
  console.log('='.repeat(60));

  const tester = new LoadTester();
  const results: LoadTestResult[] = [];

  // Test scenarios
  const scenarios = [
    {
      name: 'Basic Provider Search',
      endpoint: '/api/providers',
      params: { limit: '20', offset: '0' },
      concurrentUsers: 5,
      requestsPerUser: 4,
    },
    {
      name: 'Provider Search with Text Filter',
      endpoint: '/api/providers',
      params: { search: 'Dr', limit: '20', offset: '0' },
      concurrentUsers: 5,
      requestsPerUser: 4,
    },
    {
      name: 'Provider Search with Type Filter',
      endpoint: '/api/providers',
      params: { typeIds: 'sample-type-id', limit: '20', offset: '0' },
      concurrentUsers: 5,
      requestsPerUser: 4,
    },
    {
      name: 'Provider Search - High Concurrency',
      endpoint: '/api/providers',
      params: { limit: '50', offset: '0' },
      concurrentUsers: 10,
      requestsPerUser: 2,
    },
    {
      name: 'Provider Search - Heavy Load',
      endpoint: '/api/providers',
      params: { search: 'provider', limit: '50', offset: '0' },
      concurrentUsers: 15,
      requestsPerUser: 2,
    },
  ];

  // Run each test scenario
  for (const scenario of scenarios) {
    console.log(`\n🧪 Running: ${scenario.name}`);
    console.log(
      `   Users: ${scenario.concurrentUsers} | Requests per user: ${scenario.requestsPerUser}`
    );

    const start = performance.now();

    try {
      const requestResults = await tester.runConcurrentRequests(
        scenario.endpoint,
        Object.fromEntries(
          Object.entries(scenario.params).filter(([_, v]) => v !== undefined)
        ) as Record<string, string>,
        scenario.concurrentUsers,
        scenario.requestsPerUser
      );

      const end = performance.now();
      const testResult = tester.analyzeResults(
        scenario.name,
        requestResults,
        scenario.concurrentUsers,
        end - start
      );

      results.push(testResult);
      tester.printResults(testResult);
    } catch (error) {
      console.log(`❌ Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Wait between scenarios
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  // Overall summary
  console.log('\n\n📊 Load Testing Summary');
  console.log('='.repeat(60));

  const avgSuccessRate = results.reduce((sum, r) => sum + r.successRate, 0) / results.length;
  const avgResponseTime = results.reduce((sum, r) => sum + r.averageTime, 0) / results.length;
  const totalRequests = results.reduce((sum, r) => sum + r.totalRequests, 0);

  console.log(`Total Requests Processed: ${totalRequests}`);
  console.log(`Average Success Rate: ${avgSuccessRate.toFixed(1)}%`);
  console.log(`Average Response Time: ${avgResponseTime.toFixed(1)}ms`);

  // Performance analysis
  const fastTests = results.filter((r) => r.averageTime < 200);
  const slowTests = results.filter((r) => r.averageTime > 500);
  const reliableTests = results.filter((r) => r.successRate > 95);

  console.log(`\n✅ Fast tests (<200ms): ${fastTests.length}/${results.length}`);
  console.log(`⚠️  Slow tests (>500ms): ${slowTests.length}/${results.length}`);
  console.log(`✅ Reliable tests (>95% success): ${reliableTests.length}/${results.length}`);

  if (slowTests.length > 0) {
    console.log('\nSlow tests requiring optimization:');
    slowTests.forEach((test) => {
      console.log(`   - ${test.endpoint}: ${test.averageTime.toFixed(1)}ms avg`);
    });
  }

  // Recommendations
  console.log('\n💡 Recommendations:');
  if (avgResponseTime > 300) {
    console.log('   - Consider adding more database indexes');
    console.log('   - Implement query result caching');
    console.log('   - Optimize database queries');
  }

  if (avgSuccessRate < 98) {
    console.log('   - Investigate error causes and improve error handling');
    console.log('   - Consider adding retry mechanisms');
  }

  const maxThroughput = Math.max(...results.map((r) => r.requestsPerSecond));
  if (maxThroughput < 20) {
    console.log('   - Consider horizontal scaling');
    console.log('   - Implement connection pooling');
    console.log('   - Add load balancing');
  }

  console.log('\n✅ Load testing completed!');
}

// Run load tests if this script is executed directly
if (require.main === module) {
  runLoadTests()
    .catch(console.error)
    .finally(() => process.exit(0));
}

export { LoadTester, runLoadTests };
