// These constants can be safely used in both client and server components
// Using a function to determine environment at runtime rather than relying on env variables

// Helper function to determine the current environment
function getEnvironment(): 'development' | 'production' | 'test' {
  // Check if we're in a browser environment
  if (typeof window !== 'undefined') {
    // Client-side environment detection
    // Use hostname to determine environment
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'development';
    }
    // Add test environment detection if needed
    // if (hostname.includes('test') || hostname.includes('staging')) {
    //   return 'test';
    // }
    return 'production';
  } else {
    // Server-side environment detection
    // Default to development for safety
    return 'development';
  }
}

// Calculate the environment once
const currentEnv = getEnvironment();

// Export constants based on the determined environment
export const isDevelopment = currentEnv === 'development';
export const isProduction = currentEnv === 'production';
export const isTest = currentEnv === 'test';
