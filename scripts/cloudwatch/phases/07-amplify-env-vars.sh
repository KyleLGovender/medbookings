#!/usr/bin/env bash

# ============================================================================
# Phase 7: Configure Amplify Environment Variables
# ============================================================================
# Updates AWS Amplify environment variables for logging configuration:
# - LOG_LEVEL: Controls logging verbosity
# - NODE_ENV: Sets application environment
# - DEBUG_*: Feature-specific debug flags (optional)
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
  log_step "Phase 7: Configure Amplify Environment Variables"

  validate_prerequisites || exit 1
  validate_config || exit 1

  echo ""
  log_info "This phase will update environment variables in AWS Amplify"
  log_warning "This may trigger a redeployment if AUTO_REDEPLOY is enabled"
  echo ""

  # Configure production environment variables
  configure_amplify_env_vars \
    "Production" \
    "${PRODUCTION_BRANCH}" \
    "${PRODUCTION_LOG_LEVEL}" \
    "${PRODUCTION_NODE_ENV}" \
    "${PRODUCTION_DEBUG_ALL}"

  # Configure staging environment variables if enabled
  if [[ "${SETUP_STAGING:-false}" == "true" ]]; then
    configure_amplify_env_vars \
      "Staging" \
      "${STAGING_BRANCH}" \
      "${STAGING_LOG_LEVEL}" \
      "${STAGING_NODE_ENV}" \
      "${STAGING_DEBUG_ALL}"
  fi

  echo ""
  log_success "Phase 7 completed successfully"

  if [[ "${AUTO_REDEPLOY:-false}" != "true" ]]; then
    echo ""
    log_info "Environment variables updated but redeployment not triggered"
    log_info "Changes will take effect on next deployment"
    log_info "To deploy now, run: aws amplify start-job --app-id ${AMPLIFY_APP_ID} --branch-name ${PRODUCTION_BRANCH} --job-type RELEASE"
  fi

  return 0
}

# ============================================================================
# Helper Functions
# ============================================================================

configure_amplify_env_vars() {
  local environment="$1"
  local branch_name="$2"
  local log_level="$3"
  local node_env="$4"
  local debug_all="$5"

  log_info "Configuring ${environment} environment variables..."

  # Get current environment variables
  log_debug "Fetching current environment variables..."
  local current_vars
  current_vars=$(aws amplify get-branch \
    --app-id "${AMPLIFY_APP_ID}" \
    --branch-name "${branch_name}" \
    --region "${AWS_REGION}" \
    --query 'branch.environmentVariables' \
    --output json 2>/dev/null || echo "{}")

  if [[ -z "${current_vars}" || "${current_vars}" == "null" ]]; then
    current_vars="{}"
  fi

  log_success "Current environment variables retrieved"

  # Prepare new environment variables (merge with existing)
  local new_vars
  new_vars=$(echo "${current_vars}" | jq \
    --arg log_level "${log_level}" \
    --arg node_env "${node_env}" \
    --arg debug_all "${debug_all}" \
    '. + {
      "LOG_LEVEL": $log_level,
      "NODE_ENV": $node_env,
      "DEBUG_ALL": $debug_all
    }')

  # Convert JSON to key=value format for AWS CLI
  local env_var_args=()
  while IFS= read -r line; do
    if [[ -n "${line}" ]]; then
      env_var_args+=("${line}")
    fi
  done < <(echo "${new_vars}" | jq -r 'to_entries | .[] | "\(.key)=\(.value)"')

  if [[ ${#env_var_args[@]} -eq 0 ]]; then
    log_error "Failed to prepare environment variables"
    return 1
  fi

  # Show what will be updated
  echo ""
  log_info "New/Updated variables:"
  echo "  LOG_LEVEL=${log_level}"
  echo "  NODE_ENV=${node_env}"
  echo "  DEBUG_ALL=${debug_all}"
  echo ""

  if [[ "${DRY_RUN:-false}" == "true" ]]; then
    log_info "[DRY RUN] Would update environment variables"
    return 0
  fi

  if ! confirm "Update ${environment} environment variables?"; then
    log_info "Skipping ${environment} environment variable update"
    return 0
  fi

  # Update environment variables
  log_info "Updating environment variables..."
  aws amplify update-branch \
    --app-id "${AMPLIFY_APP_ID}" \
    --branch-name "${branch_name}" \
    --environment-variables "${env_var_args[@]}" \
    --region "${AWS_REGION}" \
    >/dev/null

  log_success "Environment variables updated for ${environment}"

  # Trigger deployment if AUTO_REDEPLOY is enabled
  if [[ "${AUTO_REDEPLOY:-false}" == "true" ]]; then
    log_info "Triggering ${environment} deployment..."

    local job_id
    job_id=$(aws amplify start-job \
      --app-id "${AMPLIFY_APP_ID}" \
      --branch-name "${branch_name}" \
      --job-type RELEASE \
      --region "${AWS_REGION}" \
      --query 'jobSummary.jobId' \
      --output text)

    if [[ -n "${job_id}" ]]; then
      log_success "Deployment triggered: ${job_id}"
      log_info "Monitor at: https://console.aws.amazon.com/amplify/home?region=${AWS_REGION}#/${AMPLIFY_APP_ID}/${branch_name}/${job_id}"
    else
      log_error "Failed to trigger deployment"
      return 1
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
