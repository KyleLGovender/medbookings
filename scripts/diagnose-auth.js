#!/usr/bin/env node

/**
 * Authentication Diagnostics Script
 *
 * This script checks for common authentication configuration issues.
 * Run with: node scripts/diagnose-auth.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('\n🔍 MedBookings Authentication Diagnostics\n');
console.log('='.repeat(60));

// Check 1: Environment Variables
console.log('\n📋 Checking Environment Variables...\n');

const requiredEnvVars = [
  'NEXTAUTH_URL',
  'AUTH_SECRET',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'DATABASE_URL',
];

const envResults = [];
requiredEnvVars.forEach((varName) => {
  const value = process.env[varName];
  const exists = !!value;
  const masked = exists ? (value.length > 20 ? `${value.substring(0, 20)}...` : value) : 'NOT SET';

  envResults.push({
    name: varName,
    exists,
    value: exists ? masked : '❌ Missing',
  });

  console.log(`  ${exists ? '✅' : '❌'} ${varName}: ${exists ? masked : 'NOT SET'}`);
});

// Check 2: NEXTAUTH_URL Format
console.log('\n🌐 Checking NEXTAUTH_URL Configuration...\n');

const nextAuthUrl = process.env.NEXTAUTH_URL;
if (nextAuthUrl) {
  try {
    const url = new URL(nextAuthUrl);
    console.log(`  ✅ NEXTAUTH_URL is valid: ${nextAuthUrl}`);
    console.log(`  📍 Protocol: ${url.protocol}`);
    console.log(`  📍 Host: ${url.host}`);
    console.log(`  📍 Expected callback URL: ${nextAuthUrl}/api/auth/callback/google`);
  } catch (e) {
    console.log(`  ❌ NEXTAUTH_URL is invalid: ${nextAuthUrl}`);
    console.log(`  Error: ${e.message}`);
  }
} else {
  console.log('  ❌ NEXTAUTH_URL is not set');
}

// Check 3: Google OAuth Configuration
console.log('\n🔐 Google OAuth Configuration...\n');

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  console.log('  ✅ Google credentials are configured');
  console.log('\n  📝 Required steps in Google Cloud Console:');
  console.log('     1. Go to https://console.cloud.google.com/apis/credentials');
  console.log('     2. Select your OAuth 2.0 Client ID');
  console.log('     3. Under "Authorized redirect URIs", ensure you have:');
  console.log(`        - ${nextAuthUrl}/api/auth/callback/google`);
  console.log('     4. For local development, also add:');
  console.log('        - http://localhost:3000/api/auth/callback/google');
} else {
  console.log('  ❌ Google credentials are missing');
}

// Check 4: Database Connection
console.log('\n💾 Checking Database Connection...\n');

if (process.env.DATABASE_URL) {
  console.log('  ✅ DATABASE_URL is set');
  console.log('  💡 To test connection, run: npx prisma db pull');
} else {
  console.log('  ❌ DATABASE_URL is not set');
}

// Check 5: File Structure
console.log('\n📁 Checking File Structure...\n');

const filesToCheck = [
  'src/app/api/auth/[...nextauth]/route.ts',
  'src/lib/auth.ts',
  'src/app/(general)/(auth)/login/page.tsx',
  'src/app/(general)/(auth)/error/page.tsx',
];

filesToCheck.forEach((file) => {
  const exists = fs.existsSync(path.join(process.cwd(), file));
  console.log(`  ${exists ? '✅' : '❌'} ${file}`);
});

// Summary and Recommendations
console.log('\n📊 Summary and Recommendations\n');
console.log('='.repeat(60));

const missingEnvVars = envResults.filter((r) => !r.exists);

if (missingEnvVars.length === 0) {
  console.log('\n  ✅ All required environment variables are set');
} else {
  console.log('\n  ❌ Missing environment variables:');
  missingEnvVars.forEach((v) => {
    console.log(`     - ${v.name}`);
  });
}

console.log('\n🔧 Common Fixes:\n');
console.log('  1. Verify NEXTAUTH_URL matches your deployment URL:');
console.log(`     Current: ${nextAuthUrl || 'NOT SET'}`);
console.log('     Staging should be: https://staging.medbookings.co.za');
console.log('     Production should be: https://medbookings.co.za');
console.log('');
console.log('  2. Check Google Cloud Console redirect URIs include:');
console.log(`     ${nextAuthUrl || 'https://staging.medbookings.co.za'}/api/auth/callback/google`);
console.log('');
console.log('  3. Verify AUTH_SECRET is set (generate with: openssl rand -base64 32)');
console.log('');
console.log('  4. Check deployment logs for detailed error messages');
console.log('');
console.log('  5. Test database connection with: npx prisma db pull');

console.log('\n' + '='.repeat(60) + '\n');

// Return exit code based on results
if (missingEnvVars.length > 0) {
  process.exit(1);
}
