import { expect, test } from '@playwright/test';

/**
 * Password Complexity E2E Tests
 *
 * Tests password validation requirements implemented in Sprint 3:
 * - Minimum 8 characters
 * - At least 1 uppercase letter
 * - At least 1 lowercase letter
 * - At least 1 number
 * - At least 1 special character
 */

test.describe('Password Complexity Validation', () => {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const testEmail = `test-${Math.floor(Math.random() * 1000000000)}@example.com`;

  test('should reject password with less than 8 characters', async ({ request }) => {
    const response = await request.post(`${baseUrl}/api/auth/register`, {
      data: {
        name: 'Test User',
        email: testEmail,
        password: 'Test1!', // Only 6 characters
      },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toBe('Validation failed');
    expect(JSON.stringify(body.details)).toContain('at least 8 characters');
  });

  test('should reject password without uppercase letter', async ({ request }) => {
    const response = await request.post(`${baseUrl}/api/auth/register`, {
      data: {
        name: 'Test User',
        email: testEmail,
        password: 'test1234!', // No uppercase
      },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toBe('Validation failed');
    expect(JSON.stringify(body.details)).toContain('uppercase letter');
  });

  test('should reject password without lowercase letter', async ({ request }) => {
    const response = await request.post(`${baseUrl}/api/auth/register`, {
      data: {
        name: 'Test User',
        email: testEmail,
        password: 'TEST1234!', // No lowercase
      },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toBe('Validation failed');
    expect(JSON.stringify(body.details)).toContain('lowercase letter');
  });

  test('should reject password without number', async ({ request }) => {
    const response = await request.post(`${baseUrl}/api/auth/register`, {
      data: {
        name: 'Test User',
        email: testEmail,
        password: 'TestPass!', // No number
      },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toBe('Validation failed');
    expect(JSON.stringify(body.details)).toContain('number');
  });

  test('should reject password without special character', async ({ request }) => {
    const response = await request.post(`${baseUrl}/api/auth/register`, {
      data: {
        name: 'Test User',
        email: testEmail,
        password: 'TestPass1', // No special character
      },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toBe('Validation failed');
    expect(JSON.stringify(body.details)).toContain('special character');
  });

  test('should accept valid password meeting all requirements', async ({ request }) => {
    const uniqueEmail = `valid-${Math.floor(Math.random() * 1000000000)}@example.com`;

    const response = await request.post(`${baseUrl}/api/auth/register`, {
      data: {
        name: 'Test User',
        email: uniqueEmail,
        password: 'ValidPass123!', // Meets all requirements
      },
    });

    // Should succeed (200 or 201)
    expect(response.status()).toBeLessThan(300);
    const body = await response.json();
    expect(body.message).toContain('Account created successfully');
  });

  test('should accept password with various special characters', async ({ request }) => {
    const passwords = [
      'Test123!@#', // ! @ #
      'Test123$%^', // $ % ^
      'Test123&*()', // & * ( )
      'Test123_+-=', // _ + - =
    ];

    for (const password of passwords) {
      const uniqueEmail = `special-${Math.floor(Math.random() * 1000000000)}-${Math.random()}@example.com`;

      const response = await request.post(`${baseUrl}/api/auth/register`, {
        data: {
          name: 'Test User',
          email: uniqueEmail,
          password,
        },
      });

      expect(response.status()).toBeLessThan(300);
    }
  });
});
