#!/bin/bash

# E2E Test Setup Script
set -e

echo "🧪 Setting up E2E test environment..."

# Check if Docker is running for test database
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker to run the test database."
    exit 1
fi

# Start test database
echo "🐘 Starting test PostgreSQL database..."
docker compose -f docker-compose.test.yml up -d postgres-test

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 5

# Setup environment variables
if [ ! -f .env.test.local ]; then
    echo "📝 Creating .env.test.local from template..."
    cp .env.test .env.test.local
    echo "✅ Please review and update .env.test.local with your test database credentials"
fi

# Install dependencies if not already installed
if [ ! -d node_modules ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Install Playwright browsers
echo "🎭 Installing Playwright browsers..."
npx playwright install

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Run database migrations on test database
echo "🗃️  Running database migrations..."
DATABASE_URL="${TEST_DATABASE_URL:-postgresql://username:password@localhost:5433/medbookings_test}" npx prisma migrate deploy

# Create debug screenshots directory
mkdir -p e2e/debug-screenshots

echo "✅ E2E test environment setup complete!"
echo ""
echo "🚀 Run tests with:"
echo "  npm run test:e2e              # Run all E2E tests"
echo "  npm run test:e2e:headed       # Run with browser UI"
echo "  npm run test:e2e:debug        # Run in debug mode"
echo "  npm run test:e2e:auth         # Run only auth tests"
echo "  npm run test:e2e:provider     # Run only provider tests"
echo "  npm run test:e2e:cleanup      # Run only cleanup tests"