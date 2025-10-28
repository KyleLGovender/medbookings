#!/usr/bin/env bash

# ============================================================================
# Phase 4: Create CloudWatch Alarms
# ============================================================================
# Creates CloudWatch alarms to monitor error rates and trigger notifications:
# - High Error Rate: Spike in server errors
# - Authentication Failures: Multiple failed login attempts
# - Sustained Errors: Persistent error conditions
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
  log_step "Phase 4: Create CloudWatch Alarms"

  validate_prerequisites || exit 1
  validate_config || exit 1

  echo ""
  log_info "This phase will create CloudWatch alarms for error monitoring"
  echo ""

  # Create production alarms
  create_environment_alarms \
    "Production" \
    "${PRODUCTION_NAMESPACE}" \
    "${PRODUCTION_SNS_TOPIC}"

  # Create staging alarms if enabled
  if [[ "${SETUP_STAGING:-false}" == "true" ]]; then
    create_environment_alarms \
      "Staging" \
      "${STAGING_NAMESPACE}" \
      "${STAGING_SNS_TOPIC}"
  fi

  echo ""
  log_success "Phase 4 completed successfully"
  return 0
}

# ============================================================================
# Helper Functions
# ============================================================================

create_environment_alarms() {
  local environment="$1"
  local namespace="$2"
  local topic_name="$3"

  log_info "Creating ${environment} CloudWatch alarms..."

  # Get SNS topic ARN
  local topic_arn
  topic_arn=$(get_sns_topic_arn "${topic_name}")

  if [[ -z "${topic_arn}" ]]; then
    log_error "SNS topic not found: ${topic_name}"
    log_error "Please run Phase 3 first to create SNS topics"
    return 1
  fi

  log_success "Using SNS topic: ${topic_arn}"

  # Create High Server Error Rate alarm
  create_alarm \
    "${APP_NAME}-${environment}-HighServerErrors" \
    "Triggers when more than ${HIGH_ERROR_THRESHOLD} server errors occur in ${HIGH_ERROR_PERIOD} seconds" \
    "${namespace}" \
    "ServerErrors" \
    "Sum" \
    "${HIGH_ERROR_PERIOD}" \
    "${HIGH_ERROR_THRESHOLD}" \
    "GreaterThanThreshold" \
    "${HIGH_ERROR_EVALUATION_PERIODS}" \
    "${topic_arn}"

  # Create Authentication Failures alarm
  create_alarm \
    "${APP_NAME}-${environment}-AuthFailures" \
    "Triggers when more than ${AUTH_FAILURE_THRESHOLD} authentication failures occur in ${AUTH_FAILURE_PERIOD} seconds" \
    "${namespace}" \
    "AuthenticationFailures" \
    "Sum" \
    "${AUTH_FAILURE_PERIOD}" \
    "${AUTH_FAILURE_THRESHOLD}" \
    "GreaterThanThreshold" \
    "${AUTH_FAILURE_EVALUATION_PERIODS}" \
    "${topic_arn}"

  # Create Sustained Error Rate alarm
  create_alarm \
    "${APP_NAME}-${environment}-SustainedErrors" \
    "Triggers when more than ${SUSTAINED_ERROR_THRESHOLD} errors occur consistently across ${SUSTAINED_ERROR_EVALUATION_PERIODS} periods" \
    "${namespace}" \
    "ServerErrors" \
    "Sum" \
    "${SUSTAINED_ERROR_PERIOD}" \
    "${SUSTAINED_ERROR_THRESHOLD}" \
    "GreaterThanThreshold" \
    "${SUSTAINED_ERROR_EVALUATION_PERIODS}" \
    "${topic_arn}"
}

create_alarm() {
  local alarm_name="$1"
  local description="$2"
  local namespace="$3"
  local metric_name="$4"
  local statistic="$5"
  local period="$6"
  local threshold="$7"
  local comparison="$8"
  local evaluation_periods="$9"
  local topic_arn="${10}"

  log_info "Creating alarm: ${alarm_name}..."

  # Check if alarm already exists
  if alarm_exists "${alarm_name}"; then
    if [[ "${FORCE:-false}" != "true" ]]; then
      log_warning "Alarm already exists: ${alarm_name}"
      if ! confirm "Update alarm?"; then
        log_info "Skipping ${alarm_name}"
        return 0
      fi
    fi
  fi

  # Create or update alarm
  run_command \
    "Create alarm: ${alarm_name}" \
    aws cloudwatch put-metric-alarm \
      --alarm-name "${alarm_name}" \
      --alarm-description "${description}" \
      --metric-name "${metric_name}" \
      --namespace "${namespace}" \
      --statistic "${statistic}" \
      --period "${period}" \
      --evaluation-periods "${evaluation_periods}" \
      --threshold "${threshold}" \
      --comparison-operator "${comparison}" \
      --alarm-actions "${topic_arn}" \
      --treat-missing-data notBreaching \
      --region "${AWS_REGION}"

  log_success "Created: ${alarm_name}"
  return 0
}

# ============================================================================
# Script Entry Point
# ============================================================================

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  main "$@"
fi
