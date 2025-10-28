#!/usr/bin/env bash

# ============================================================================
# Phase 3: Create SNS Topics and Email Subscriptions
# ============================================================================
# Creates SNS topics for CloudWatch alarm notifications and subscribes
# email addresses to receive alerts.
# ============================================================================

set -euo pipefail

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

# Source utilities
source "${SCRIPT_DIR}/../lib/utils.sh"

# Source configuration
if [[ -f "${SCRIPT_DIR}/../config.sh" ]]; then
  source "${SCRIPT_DIR}/../config.sh"
else
  log_error "Configuration file not found: ${SCRIPT_DIR}/../config.sh"
  exit 1
fi

# ============================================================================
# Main Function
# ============================================================================

main() {
  log_step "Phase 3: Create SNS Topics and Email Subscriptions"

  validate_prerequisites || exit 1
  validate_config || exit 1

  echo ""
  log_info "This phase will create SNS topics and email subscriptions for alerts"
  echo ""

  # Create production SNS topic and subscription
  create_sns_topic_and_subscription \
    "Production" \
    "${PRODUCTION_SNS_TOPIC}" \
    "${PRODUCTION_ALERT_EMAIL}"

  # Create staging SNS topic and subscription if enabled
  if [[ "${SETUP_STAGING:-false}" == "true" ]]; then
    create_sns_topic_and_subscription \
      "Staging" \
      "${STAGING_SNS_TOPIC}" \
      "${STAGING_ALERT_EMAIL}"
  fi

  echo ""
  log_success "Phase 3 completed successfully"
  echo ""
  log_warning "IMPORTANT: Check your email and click the confirmation link(s)"
  log_warning "Subscriptions will not receive alerts until confirmed"
  return 0
}

# ============================================================================
# Helper Functions
# ============================================================================

create_sns_topic_and_subscription() {
  local environment="$1"
  local topic_name="$2"
  local email="$3"

  log_info "Setting up ${environment} SNS topic..."

  # Check if topic already exists
  local topic_arn
  if sns_topic_exists "${topic_name}"; then
    topic_arn=$(get_sns_topic_arn "${topic_name}")
    log_success "SNS topic already exists: ${topic_name}"
    log_info "Topic ARN: ${topic_arn}"
  else
    # Create SNS topic
    topic_arn=$(aws sns create-topic \
      --name "${topic_name}" \
      --region "${AWS_REGION}" \
      --tags "Key=Environment,Value=${environment}" "Key=Application,Value=${APP_NAME}" \
      --query 'TopicArn' \
      --output text)

    if [[ -n "${topic_arn}" ]]; then
      log_success "Created SNS topic: ${topic_name}"
      log_info "Topic ARN: ${topic_arn}"
    else
      log_error "Failed to create SNS topic: ${topic_name}"
      return 1
    fi
  fi

  # Check if email subscription already exists
  local existing_subscription
  existing_subscription=$(aws sns list-subscriptions-by-topic \
    --topic-arn "${topic_arn}" \
    --region "${AWS_REGION}" \
    --query "Subscriptions[?Endpoint=='${email}' && Protocol=='email'].SubscriptionArn" \
    --output text 2>/dev/null || echo "")

  if [[ -n "${existing_subscription}" && "${existing_subscription}" != "PendingConfirmation" ]]; then
    log_success "Email subscription already exists and confirmed"
    log_info "Subscription: ${email}"
    return 0
  fi

  if [[ "${existing_subscription}" == "PendingConfirmation" ]]; then
    log_warning "Email subscription exists but pending confirmation"
    log_warning "Please check ${email} for confirmation link"
    return 0
  fi

  # Create email subscription
  local subscription_arn
  subscription_arn=$(aws sns subscribe \
    --topic-arn "${topic_arn}" \
    --protocol email \
    --notification-endpoint "${email}" \
    --region "${AWS_REGION}" \
    --query 'SubscriptionArn' \
    --output text)

  if [[ -n "${subscription_arn}" ]]; then
    log_success "Created email subscription for ${environment}"
    log_info "Email: ${email}"
    log_warning "Check your email and click the confirmation link"
  else
    log_error "Failed to create email subscription"
    return 1
  fi

  # Wait for confirmation if not skipped
  if [[ "${SKIP_EMAIL_CONFIRMATION:-false}" != "true" ]]; then
    echo ""
    log_info "Waiting for email confirmation..."
    log_info "Press Enter after confirming, or Ctrl+C to skip"
    read -r

    # Check if subscription was confirmed
    local confirmed
    confirmed=$(aws sns list-subscriptions-by-topic \
      --topic-arn "${topic_arn}" \
      --region "${AWS_REGION}" \
      --query "Subscriptions[?Endpoint=='${email}' && Protocol=='email' && SubscriptionArn!='PendingConfirmation'].SubscriptionArn" \
      --output text 2>/dev/null || echo "")

    if [[ -n "${confirmed}" ]]; then
      log_success "Email subscription confirmed!"
    else
      log_warning "Subscription still pending. You can confirm later."
    fi
  fi

  return 0
}

# ============================================================================
# Script Entry Point
# ============================================================================

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  main "$@"
fi
