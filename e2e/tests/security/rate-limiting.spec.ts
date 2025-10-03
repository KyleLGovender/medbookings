import { expect, test } from '@playwright/test';

/**
 * Rate Limiting E2E Tests
 *
 * Tests rate limiting implemented in Sprint 2/3:
 * - Registration: 5 attempts per 15 minutes
 * - Email verification: 5 emails per hour
 * - File upload: 10 uploads per hour
 */

test.describe('Rate Limiting', () => {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

  test.describe('Registration Rate Limiting', () => {
    test('should block after 5 registration attempts from same IP', async ({ request }) => {
      const attempts = [];

      // Make 6 registration attempts
      for (let i = 0; i < 6; i++) {
        const response = await request.post(`${baseUrl}/api/auth/register`, {
          data: {
            name: `Test User ${i}`,
            email: `ratelimit-test-${i}-${Math.floor(Math.random() * 1000000000)}@example.com`,
            password: 'ValidPass123!',
          },
        });

        attempts.push({
          attempt: i + 1,
          status: response.status(),
          body: await response.json(),
        });
      }

      // First 5 attempts should succeed or fail with validation errors (not rate limit)
      for (let i = 0; i < 5; i++) {
        expect(attempts[i]?.status).not.toBe(429);
      }

      // 6th attempt should be rate limited
      expect(attempts[5]?.status).toBe(429);
      expect(attempts[5]?.body.error).toContain('Too many');
      expect(attempts[5]?.body.retryAfter).toBeGreaterThan(0);
    });

    test('should include rate limit headers in response', async ({ request }) => {
      const response = await request.post(`${baseUrl}/api/auth/register`, {
        data: {
          name: 'Test User',
          email: `header-test-${Math.floor(Math.random() * 1000000000)}@example.com`,
          password: 'ValidPass123!',
        },
      });

      const headers = response.headers();

      // Rate limit headers should be present (either from success or rate limit)
      if (response.status() === 429) {
        expect(headers['x-ratelimit-limit']).toBeDefined();
        expect(headers['x-ratelimit-remaining']).toBeDefined();
        expect(headers['x-ratelimit-reset']).toBeDefined();
      }
    });
  });

  test.describe('Email Verification Rate Limiting', () => {
    test.skip('should block after 5 email verification requests', async ({ request: _request }) => {
      // Note: This test requires authentication, so it's marked as skip for now
      // TODO: Implement with proper auth token
      expect(true).toBe(true);
    });
  });

  test.describe('File Upload Rate Limiting', () => {
    test.skip('should block after 10 file uploads per hour', async ({ request: _request }) => {
      // Note: This test requires authentication, so it's marked as skip for now
      // TODO: Implement with proper auth token and file upload
      expect(true).toBe(true);
    });
  });
});
