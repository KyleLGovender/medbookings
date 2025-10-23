import { expect, test } from '@playwright/test';

/**
 * Security Headers E2E Tests
 *
 * Tests security headers implemented in Sprint 3:
 * - Strict-Transport-Security (HSTS)
 * - X-Frame-Options
 * - X-Content-Type-Options
 * - Referrer-Policy
 * - Permissions-Policy
 */

test.describe('Security Headers', () => {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

  test('should have Strict-Transport-Security header (HSTS)', async ({ request }) => {
    const response = await request.get(baseUrl);
    const headers = response.headers();

    expect(headers['strict-transport-security']).toBeDefined();
    expect(headers['strict-transport-security']).toContain('max-age');
    expect(headers['strict-transport-security']).toContain('includeSubDomains');
    expect(headers['strict-transport-security']).toContain('preload');
  });

  test('should have X-Frame-Options header (clickjacking protection)', async ({ request }) => {
    const response = await request.get(baseUrl);
    const headers = response.headers();

    expect(headers['x-frame-options']).toBeDefined();
    expect(headers['x-frame-options']).toBe('SAMEORIGIN');
  });

  test('should have X-Content-Type-Options header (MIME sniffing protection)', async ({
    request,
  }) => {
    const response = await request.get(baseUrl);
    const headers = response.headers();

    expect(headers['x-content-type-options']).toBeDefined();
    expect(headers['x-content-type-options']).toBe('nosniff');
  });

  test('should have Referrer-Policy header', async ({ request }) => {
    const response = await request.get(baseUrl);
    const headers = response.headers();

    expect(headers['referrer-policy']).toBeDefined();
    expect(headers['referrer-policy']).toBe('origin-when-cross-origin');
  });

  test('should have Permissions-Policy header', async ({ request }) => {
    const response = await request.get(baseUrl);
    const headers = response.headers();

    expect(headers['permissions-policy']).toBeDefined();
    expect(headers['permissions-policy']).toContain('camera=()');
    expect(headers['permissions-policy']).toContain('microphone=()');
    expect(headers['permissions-policy']).toContain('geolocation=()');
  });

  test('should have X-DNS-Prefetch-Control header', async ({ request }) => {
    const response = await request.get(baseUrl);
    const headers = response.headers();

    expect(headers['x-dns-prefetch-control']).toBeDefined();
    expect(headers['x-dns-prefetch-control']).toBe('on');
  });

  test('should have all security headers on API routes', async ({ request }) => {
    // Test that security headers are also present on API routes
    const response = await request.get(`${baseUrl}/api/auth/signin`);
    const headers = response.headers();

    // All security headers should be present
    expect(headers['strict-transport-security']).toBeDefined();
    expect(headers['x-frame-options']).toBeDefined();
    expect(headers['x-content-type-options']).toBeDefined();
    expect(headers['referrer-policy']).toBeDefined();
    expect(headers['permissions-policy']).toBeDefined();
  });

  test('should have all security headers on static pages', async ({ request }) => {
    const pages = ['/', '/login', '/providers'];

    for (const page of pages) {
      const response = await request.get(`${baseUrl}${page}`);
      const headers = response.headers();

      expect(headers['strict-transport-security']).toBeDefined();
      expect(headers['x-frame-options']).toBeDefined();
      expect(headers['x-content-type-options']).toBeDefined();
    }
  });
});
