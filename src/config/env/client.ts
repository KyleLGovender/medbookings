// For client-side environment variables in Next.js, we can use a simpler approach
// since we only need public variables that are safe to expose to the browser

// This approach avoids direct process.env access which causes lint errors
const NODE_ENV =
  typeof window !== 'undefined'
    ? (window as any).__NEXT_DATA__?.env?.NEXT_PUBLIC_NODE_ENV || 'development'
    : 'development';

// Get Google Maps API key from Next.js public environment variables
const GOOGLE_MAPS_API_KEY =
  typeof window !== 'undefined'
    ? (window as any).__NEXT_DATA__?.env?.GOOGLE_MAPS_API_KEY || ''
    : '';

const env = {
  NEXT_PUBLIC_NODE_ENV: NODE_ENV as 'development' | 'production' | 'test',
  GOOGLE_MAPS_API_KEY,
};

export default env;
