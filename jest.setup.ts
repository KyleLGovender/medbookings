// In jest.setup.ts or similar
// Polyfill TextEncoder and TextDecoder using Node's 'util' module
// Note: `fetch` from 'undici' might also be needed globally
// Used for global setup, like extending jest-dom matchers
import '@testing-library/jest-dom';

// Mock ResizeObserver (still useful)
(globalThis as any).ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// We are temporarily removing the manual polyfills for TextEncoder, Request, etc.,
// as next/jest should handle providing a suitable environment.
