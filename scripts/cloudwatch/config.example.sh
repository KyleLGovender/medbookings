#!/usr/bin/env bash

# ============================================================================
# MedBookings CloudWatch Automation Configuration
# ============================================================================
# Copy this file to config.sh and customize with your values:
#   cp config.example.sh config.sh
#
# Then run the setup script:
#   ./setup-cloudwatch.sh
# ============================================================================

# ----------------------------------------------------------------------------
# AWS Configuration
# ----------------------------------------------------------------------------

# AWS Region where your Amplify app is deployed
AWS_REGION="eu-west-1"

# AWS Amplify App ID (find in Amplify console URL)
# Example: https://console.aws.amazon.com/amplify/home?region=eu-west-1#/d123abc456xyz
AMPLIFY_APP_ID="your-app-id-here"

# ----------------------------------------------------------------------------
# Environment Configuration
# ----------------------------------------------------------------------------

# Branch names for your environments
PRODUCTION_BRANCH="master"
STAGING_BRANCH="staging"  # Leave empty "" if you don't have staging

# Enable/disable staging environment setup
SETUP_STAGING=true  # Set to false to skip staging environment

# ----------------------------------------------------------------------------
# Log Groups
# ----------------------------------------------------------------------------

# Log group names (auto-constructed from Amplify app ID and branch)
# Override these only if your log groups have custom names
PRODUCTION_LOG_GROUP="/aws/amplify/${AMPLIFY_APP_ID}/${PRODUCTION_BRANCH}/server"
STAGING_LOG_GROUP="/aws/amplify/${AMPLIFY_APP_ID}/${STAGING_BRANCH}/server"

# Log retention periods (in days)
PRODUCTION_RETENTION_DAYS=30  # 30 days for production (compliance)
STAGING_RETENTION_DAYS=7      # 7 days for staging (cost optimization)

# ----------------------------------------------------------------------------
# Alert Email Addresses
# ----------------------------------------------------------------------------

# Email addresses for CloudWatch alarm notifications
# These will receive alerts when errors exceed thresholds
PRODUCTION_ALERT_EMAIL="your-team-email@example.com"
STAGING_ALERT_EMAIL="your-dev-email@example.com"

# ----------------------------------------------------------------------------
# Alarm Thresholds
# ----------------------------------------------------------------------------

# High Error Rate Alarm - Triggers when errors spike
HIGH_ERROR_THRESHOLD=10           # Number of errors in 5 minutes
HIGH_ERROR_PERIOD=300             # Period in seconds (5 minutes)
HIGH_ERROR_EVALUATION_PERIODS=1   # How many periods must exceed threshold

# Authentication Failure Alarm - Detects potential attacks
AUTH_FAILURE_THRESHOLD=5          # Number of auth failures in 5 minutes
AUTH_FAILURE_PERIOD=300           # Period in seconds (5 minutes)
AUTH_FAILURE_EVALUATION_PERIODS=1 # How many periods must exceed threshold

# Sustained Error Rate Alarm - Detects persistent issues
SUSTAINED_ERROR_THRESHOLD=3       # Number of errors in 5 minutes
SUSTAINED_ERROR_PERIOD=300        # Period in seconds (5 minutes)
SUSTAINED_ERROR_EVALUATION_PERIODS=3  # Must be high for 15 minutes (3 x 5min)

# ----------------------------------------------------------------------------
# Application Configuration
# ----------------------------------------------------------------------------

# Application name (used for namespacing metrics and resources)
APP_NAME="MedBookings"

# Service name (used in metric namespaces)
SERVICE_NAME="medbookings"

# ----------------------------------------------------------------------------
# Deployment Options
# ----------------------------------------------------------------------------

# Automatically redeploy Amplify after updating environment variables
AUTO_REDEPLOY=false  # Set to true to trigger automatic deployment

# ----------------------------------------------------------------------------
# Metric Namespaces
# ----------------------------------------------------------------------------

# CloudWatch metric namespaces (used to organize metrics)
PRODUCTION_NAMESPACE="${APP_NAME}/Production"
STAGING_NAMESPACE="${APP_NAME}/Staging"

# ----------------------------------------------------------------------------
# SNS Topic Names
# ----------------------------------------------------------------------------

# SNS topic names for alarm notifications
PRODUCTION_SNS_TOPIC="${SERVICE_NAME}-production-alerts"
STAGING_SNS_TOPIC="${SERVICE_NAME}-staging-alerts"

# ----------------------------------------------------------------------------
# Dashboard Names
# ----------------------------------------------------------------------------

# CloudWatch dashboard names
PRODUCTION_DASHBOARD="${APP_NAME}-Production"
STAGING_DASHBOARD="${APP_NAME}-Staging"

# ----------------------------------------------------------------------------
# Advanced Options
# ----------------------------------------------------------------------------

# Verbosity level (0=quiet, 1=normal, 2=verbose, 3=debug)
VERBOSITY=1

# Dry run mode (set to true to preview without making changes)
DRY_RUN=false

# Force mode (set to true to recreate existing resources)
FORCE=false

# Skip email confirmation wait (set to true for CI/CD)
SKIP_EMAIL_CONFIRMATION=false

# ----------------------------------------------------------------------------
# Environment Variables to Set in Amplify
# ----------------------------------------------------------------------------

# Log level for application
PRODUCTION_LOG_LEVEL="info"   # Options: debug, info, warn, error
STAGING_LOG_LEVEL="debug"     # More verbose for staging

# Node environment
PRODUCTION_NODE_ENV="production"
STAGING_NODE_ENV="staging"

# Debug flags (optional - enable specific debug logging)
PRODUCTION_DEBUG_ALL="false"
STAGING_DEBUG_ALL="false"

# ============================================================================
# DO NOT EDIT BELOW THIS LINE
# ============================================================================

# Configuration validation flag
CONFIG_VERSION="1.0.0"
CONFIG_LOADED=true
