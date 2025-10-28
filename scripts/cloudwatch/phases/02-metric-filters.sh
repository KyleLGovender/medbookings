#!/usr/bin/env bash

# ============================================================================
# Phase 2: Create CloudWatch Metric Filters
# ============================================================================
# Creates metric filters to extract error patterns from logs:
# - ServerErrors: All error-level log entries
# - AuthenticationFailures: Failed sign-in attempts
# - TRPCErrors: Failed tRPC API requests
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
  log_step "Phase 2: Create CloudWatch Metric Filters"

  validate_prerequisites || exit 1
  validate_config || exit 1

  echo ""
  log_info "This phase will create metric filters to extract error patterns from logs"
  echo ""

  # Create production metric filters
  create_environment_filters \
    "Production" \
    "${PRODUCTION_LOG_GROUP}" \
    "${PRODUCTION_NAMESPACE}"

  # Create staging metric filters if enabled
  if [[ "${SETUP_STAGING:-false}" == "true" ]]; then
    create_environment_filters \
      "Staging" \
      "${STAGING_LOG_GROUP}" \
      "${STAGING_NAMESPACE}"
  fi

  echo ""
  log_success "Phase 2 completed successfully"
  return 0
}

# ============================================================================
# Helper Functions
# ============================================================================

create_environment_filters() {
  local environment="$1"
  local log_group="$2"
  local namespace="$3"

  log_info "Creating ${environment} metric filters..."

  # Check if log group exists
  if ! log_group_exists "${log_group}"; then
    log_error "Log group not found: ${log_group}"
    log_error "Please enable server-side logging in AWS Amplify first"
    return 1
  fi

  # Create ServerErrors filter
  create_metric_filter \
    "${environment}" \
    "${log_group}" \
    "ServerErrors" \
    '{ $.level = "error" }' \
    "${namespace}" \
    "ServerErrors" \
    "Count" \
    "Tracks all error-level log entries"

  # Create AuthenticationFailures filter
  create_metric_filter \
    "${environment}" \
    "${log_group}" \
    "AuthenticationFailures" \
    '{ $.message = "*Sign-in failed*" || $.message = "*Authentication error*" || $.message = "*sign-in blocked*" }' \
    "${namespace}" \
    "AuthenticationFailures" \
    "Count" \
    "Tracks failed authentication attempts"

  # Create TRPCErrors filter
  create_metric_filter \
    "${environment}" \
    "${log_group}" \
    "TRPCErrors" \
    '{ $.message = "tRPC request failed" }' \
    "${namespace}" \
    "TRPCErrors" \
    "Count" \
    "Tracks failed tRPC API requests"
}

create_metric_filter() {
  local environment="$1"
  local log_group="$2"
  local filter_name="$3"
  local filter_pattern="$4"
  local namespace="$5"
  local metric_name="$6"
  local unit="$7"
  local description="$8"

  log_info "Creating filter: ${filter_name}..."

  # Check if filter already exists
  if metric_filter_exists "${log_group}" "${filter_name}"; then
    if [[ "${FORCE:-false}" != "true" ]]; then
      log_warning "Metric filter already exists: ${filter_name}"
      if ! confirm "Recreate filter?"; then
        log_info "Skipping ${filter_name}"
        return 0
      fi
    fi

    # Delete existing filter
    run_command \
      "Delete existing filter: ${filter_name}" \
      aws logs delete-metric-filter \
        --log-group-name "${log_group}" \
        --filter-name "${filter_name}" \
        --region "${AWS_REGION}"
  fi

  # Create metric filter
  run_command \
    "Create ${environment} filter: ${filter_name}" \
    aws logs put-metric-filter \
      --log-group-name "${log_group}" \
      --filter-name "${filter_name}" \
      --filter-pattern "${filter_pattern}" \
      --metric-transformations \
        "metricName=${metric_name},metricNamespace=${namespace},metricValue=1,defaultValue=0,unit=${unit}" \
      --region "${AWS_REGION}"

  log_success "Created: ${filter_name}"
  return 0
}

# ============================================================================
# Script Entry Point
# ============================================================================

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  main "$@"
fi
