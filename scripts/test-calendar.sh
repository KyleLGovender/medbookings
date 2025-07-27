#!/bin/bash

# Calendar-focused testing script
# Runs only calendar-related e2e tests with minimal setup

echo "🗓️ Starting calendar-focused e2e tests..."

# Use the calendar-specific Playwright config
npx playwright test --config=playwright-calendar.config.ts

echo "✅ Calendar e2e tests completed!"