#!/usr/bin/env bash

# ============================================================================
# Phase 1: Configure Log Retention Policies
# ============================================================================
# Sets retention policies for CloudWatch log groups to manage costs:
# - Production: 30 days (compliance and debugging)
# - Staging: 7 days (cost optimization)
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
  log_error "Please copy config.example.sh to config.sh and configure it"
  exit 1
fi

# ============================================================================
# Main Function
# ============================================================================

main() {
  log_step "Phase 1: Configure Log Retention Policies"

  # Validate prerequisites
  validate_prerequisites || exit 1
  validate_config || exit 1

  echo ""
  log_info "This phase will configure retention policies for CloudWatch log groups"
  log_info "Production: ${PRODUCTION_RETENTION_DAYS} days"
  if [[ "${SETUP_STAGING:-false}" == "true" ]]; then
    log_info "Staging: ${STAGING_RETENTION_DAYS} days"
  fi
  echo ""

  # Configure production log retention
  configure_log_retention \
    "Production" \
    "${PRODUCTION_LOG_GROUP}" \
    "${PRODUCTION_RETENTION_DAYS}"

  # Configure staging log retention if enabled
  if [[ "${SETUP_STAGING:-false}" == "true" ]]; then
    configure_log_retention \
      "Staging" \
      "${STAGING_LOG_GROUP}" \
      "${STAGING_RETENTION_DAYS}"
  fi

  echo ""
  log_success "Phase 1 completed successfully"
  return 0
}

# ============================================================================
# Helper Functions
# ============================================================================

configure_log_retention() {
  local environment="$1"
  local log_group="$2"
  local retention_days="$3"

  log_info "Configuring ${environment} log retention..."

  # Check if log group exists
  if ! log_group_exists "${log_group}"; then
    log_warning "Log group not found: ${log_group}"
    log_warning "Server-side logging may not be enabled in AWS Amplify yet"
    log_warning "Skipping ${environment} log retention configuration"
    return 1
  fi

  log_success "Log group found: ${log_group}"

  # Get current retention policy
  local current_retention
  current_retention=$(aws logs describe-log-groups \
    --log-group-name-prefix "${log_group}" \
    --region "${AWS_REGION}" \
    --query "logGroups[?logGroupName=='${log_group}'].retentionInDays" \
    --output text 2>/dev/null || echo "")

  if [[ -n "${current_retention}" && "${current_retention}" != "None" ]]; then
    log_info "Current retention: ${current_retention} days"

    if [[ "${current_retention}" == "${retention_days}" ]]; then
      log_success "Retention already set to ${retention_days} days"
      return 0
    fi

    if [[ "${FORCE:-false}" != "true" ]]; then
      log_warning "Retention policy already exists (${current_retention} days)"
      if ! confirm "Update to ${retention_days} days?"; then
        log_info "Skipping retention update for ${environment}"
        return 0
      fi
    fi
  else
    log_info "No retention policy set (logs kept indefinitely)"
  fi

  # Set retention policy
  run_command \
    "Set ${environment} log retention to ${retention_days} days" \
    aws logs put-retention-policy \
      --log-group-name "${log_group}" \
      --retention-in-days "${retention_days}" \
      --region "${AWS_REGION}"

  return 0
}

# ============================================================================
# Script Entry Point
# ============================================================================

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  main "$@"
fi
