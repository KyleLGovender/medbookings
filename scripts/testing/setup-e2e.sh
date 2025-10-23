#!/bin/bash

# E2E Testing Setup Script
set -e

echo "🧪 Setting up E2E test environment for MedBookings..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}$1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if Docker is running
print_status "Checking Docker..."
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker to run the test database."
    exit 1
fi
print_success "Docker is running"

# Check if Node.js and npm are available
print_status "Checking Node.js and npm..."
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    print_error "npm is not installed"
    exit 1
fi
print_success "Node.js and npm are available"

# Install dependencies if not already installed
if [ ! -d node_modules ]; then
    print_status "Installing dependencies..."
    npm install
    print_success "Dependencies installed"
else
    print_status "Dependencies already installed"
fi

# Install Playwright browsers
print_status "Installing Playwright browsers..."
npx playwright install
print_success "Playwright browsers installed"

# Setup environment variables
if [ ! -f .env.test.local ]; then
    print_status "Creating .env.test.local from template..."
    cp .env.test .env.test.local
    print_warning "Please review and update .env.test.local with your test database credentials"
else
    print_status ".env.test.local already exists"
fi

# Start test database
print_status "Starting test PostgreSQL database..."
docker-compose -f docker-compose.test.yml up -d postgres-test

# Wait for database to be ready
print_status "Waiting for database to be ready..."
timeout=30
while [ $timeout -gt 0 ]; do
    if docker-compose -f docker-compose.test.yml exec -T postgres-test pg_isready -U medbookings_test > /dev/null 2>&1; then
        break
    fi
    sleep 1
    timeout=$((timeout - 1))
done

if [ $timeout -eq 0 ]; then
    print_error "Database failed to start within 30 seconds"
    exit 1
fi
print_success "Database is ready"

# Generate Prisma client
print_status "Generating Prisma client..."
npx prisma generate
print_success "Prisma client generated"

# Run database migrations on test database
print_status "Running database migrations..."
dotenv -e .env.test.local -- npx prisma migrate deploy
print_success "Database migrations completed"

# Seed test database if seed file exists
if [ -f prisma/seed.mts ]; then
    print_status "Seeding test database..."
    dotenv -e .env.test.local -- npx prisma db seed
    print_success "Database seeded"
fi

# Create necessary directories
print_status "Creating test directories..."
mkdir -p e2e/debug-screenshots
mkdir -p e2e/test-results
mkdir -p e2e/.auth
print_success "Test directories created"

# Run a quick test to verify setup
print_status "Running setup verification test..."
npm run test:auth > /dev/null 2>&1 && print_success "Setup verification passed" || print_warning "Setup verification failed - tests may still work"

echo ""
print_success "E2E test environment setup complete!"
echo ""
echo -e "${BLUE}🚀 Available test commands:${NC}"
echo "  npm run test                   # Run all E2E tests"
echo "  npm run test:headed            # Run with browser UI visible"
echo "  npm run test:ui                # Run with Playwright test explorer"
echo "  npm run test:debug             # Run in debug mode"
echo "  npm run test:auth              # Run only authentication tests"
echo "  npm run test:booking           # Run only booking tests"
echo "  npm run test:provider          # Run only provider tests"
echo "  npm run test:report            # View test results"
echo ""
echo -e "${BLUE}🛠️  Database management:${NC}"
echo "  npm run test:db:setup          # Start test database"
echo "  npm run test:db:migrate        # Run migrations"
echo "  npm run test:db:seed           # Seed test data"
echo ""
echo -e "${BLUE}📊 Test database status:${NC}"
docker-compose -f docker-compose.test.yml ps postgres-test
echo ""
echo -e "${YELLOW}💡 Next steps:${NC}"
echo "1. Review .env.test.local and update if needed"
echo "2. Run 'npm run test' to execute all tests"
echo "3. Use 'npm run test:headed' to watch tests run in browser"