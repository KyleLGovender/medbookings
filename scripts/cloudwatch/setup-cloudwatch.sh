#!/usr/bin/env bash

# ============================================================================
# MedBookings CloudWatch Setup - Main Orchestrator
# ============================================================================
# Automates the setup of AWS CloudWatch monitoring for MedBookings.
# Based on the documentation in /docs/CLOUDWATCH_SETUP.md
#
# Usage:
#   ./setup-cloudwatch.sh                    Run all phases interactively
#   ./setup-cloudwatch.sh --phase 02         Run specific phase
#   ./setup-cloudwatch.sh --dry-run          Preview without making changes
#   ./setup-cloudwatch.sh --help             Show help
#
# Prerequisites:
#   - AWS CLI v2 installed and configured
#   - jq installed
#   - config.sh file created from config.example.sh
#   - IAM permissions for CloudWatch, SNS, and Amplify
# ============================================================================

set -euo pipefail

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

# Version
VERSION="1.0.0"

# ============================================================================
# Parse Command Line Arguments
# ============================================================================

PHASES_TO_RUN=()
SHOW_HELP=false
SHOW_VERSION=false
RUN_ALL=true

while [[ $# -gt 0 ]]; do
  case $1 in
    --phase)
      RUN_ALL=false
      PHASES_TO_RUN+=("$2")
      shift 2
      ;;
    --all)
      RUN_ALL=true
      shift
      ;;
    --dry-run)
      export DRY_RUN=true
      shift
      ;;
    --force)
      export FORCE=true
      shift
      ;;
    --non-interactive)
      export SKIP_CONFIRMATION=true
      export SKIP_EMAIL_CONFIRMATION=true
      shift
      ;;
    --skip-email-confirmation)
      export SKIP_EMAIL_CONFIRMATION=true
      shift
      ;;
    --help|-h)
      SHOW_HELP=true
      shift
      ;;
    --version|-v)
      SHOW_VERSION=true
      shift
      ;;
    *)
      echo "Unknown option: $1"
      echo "Use --help for usage information"
      exit 1
      ;;
  esac
done

# ============================================================================
# Show Help or Version
# ============================================================================

if [[ "${SHOW_VERSION}" == "true" ]]; then
  echo "MedBookings CloudWatch Setup v${VERSION}"
  exit 0
fi

if [[ "${SHOW_HELP}" == "true" ]]; then
  cat <<EOF
MedBookings CloudWatch Setup v${VERSION}

Automates AWS CloudWatch monitoring setup for MedBookings application.

USAGE:
  ./setup-cloudwatch.sh [OPTIONS]

OPTIONS:
  --phase <phase>           Run specific phase (can be used multiple times)
                            Available phases:
                              01-log-retention
                              02-metric-filters
                              03-sns-topics
                              04-alarms
                              05-dashboard
                              06-log-insights-queries
                              07-amplify-env-vars

  --all                     Run all phases (default)
  --dry-run                 Preview changes without executing
  --force                   Recreate existing resources
  --non-interactive         Run without prompts (for CI/CD)
  --skip-email-confirmation Skip waiting for email confirmation
  --help, -h                Show this help message
  --version, -v             Show version information

EXAMPLES:
  # Run full setup interactively
  ./setup-cloudwatch.sh

  # Run specific phases
  ./setup-cloudwatch.sh --phase 02-metric-filters --phase 03-sns-topics

  # Preview changes without executing
  ./setup-cloudwatch.sh --dry-run

  # Run in CI/CD mode
  ./setup-cloudwatch.sh --non-interactive --all

PREREQUISITES:
  1. Copy config.example.sh to config.sh and configure it:
     cp config.example.sh config.sh

  2. Install required tools:
     - AWS CLI v2: https://aws.amazon.com/cli/
     - jq: https://stedolan.github.io/jq/

  3. Configure AWS credentials:
     aws configure

  4. Ensure IAM permissions for CloudWatch, SNS, and Amplify

PHASES:
  Phase 1: Configure log retention policies
  Phase 2: Create CloudWatch metric filters
  Phase 3: Create SNS topics and email subscriptions
  Phase 4: Create CloudWatch alarms
  Phase 5: Create monitoring dashboards
  Phase 6: Generate Log Insights query reference
  Phase 7: Configure Amplify environment variables

For more details, see: /docs/CLOUDWATCH_SETUP.md

EOF
  exit 0
fi

# ============================================================================
# Source Dependencies
# ============================================================================

# Source utilities
if [[ ! -f "${SCRIPT_DIR}/lib/utils.sh" ]]; then
  echo "Error: utils.sh not found at ${SCRIPT_DIR}/lib/utils.sh"
  exit 1
fi
source "${SCRIPT_DIR}/lib/utils.sh"

# Source configuration
if [[ ! -f "${SCRIPT_DIR}/config.sh" ]]; then
  log_error "Configuration file not found: ${SCRIPT_DIR}/config.sh"
  log_error "Please copy config.example.sh to config.sh and configure it:"
  log_error "  cp ${SCRIPT_DIR}/config.example.sh ${SCRIPT_DIR}/config.sh"
  exit 1
fi
source "${SCRIPT_DIR}/config.sh"

# ============================================================================
# Main Function
# ============================================================================

main() {
  echo ""
  echo "${COLOR_BOLD}${COLOR_BLUE}=========================================${COLOR_RESET}"
  echo "${COLOR_BOLD}${COLOR_BLUE}MedBookings CloudWatch Setup v${VERSION}${COLOR_RESET}"
  echo "${COLOR_BOLD}${COLOR_BLUE}=========================================${COLOR_RESET}"
  echo ""

  # Validate prerequisites
  log_step "Validating Prerequisites"
  validate_prerequisites || exit 1
  validate_config || exit 1

  # Show configuration
  show_config

  # Confirm before proceeding
  if [[ "${SKIP_CONFIRMATION:-false}" != "true" ]]; then
    if [[ "${DRY_RUN:-false}" == "true" ]]; then
      log_info "Running in DRY RUN mode - no changes will be made"
    fi

    echo ""
    if ! confirm "Proceed with CloudWatch setup?" "y"; then
      log_info "Setup cancelled by user"
      exit 0
    fi
    echo ""
  fi

  # Determine which phases to run
  local phases=()
  if [[ "${RUN_ALL}" == "true" ]]; then
    phases=(
      "01-log-retention"
      "02-metric-filters"
      "03-sns-topics"
      "04-alarms"
      "05-dashboard"
      "06-log-insights-queries"
      "07-amplify-env-vars"
    )
  else
    phases=("${PHASES_TO_RUN[@]}")
  fi

  # Run phases
  local phase_count=${#phases[@]}
  local current=0

  for phase in "${phases[@]}"; do
    current=$((current + 1))
    echo ""
    echo "${COLOR_BOLD}=========================================${COLOR_RESET}"
    echo "${COLOR_BOLD}Running Phase ${current}/${phase_count}: ${phase}${COLOR_RESET}"
    echo "${COLOR_BOLD}=========================================${COLOR_RESET}"
    echo ""

    local phase_script="${SCRIPT_DIR}/phases/${phase}.sh"

    if [[ ! -f "${phase_script}" ]]; then
      log_error "Phase script not found: ${phase_script}"
      mark_phase_failed "${phase}"
      continue
    fi

    if bash "${phase_script}"; then
      mark_phase_completed "${phase}"
    else
      log_error "Phase failed: ${phase}"
      mark_phase_failed "${phase}"

      if [[ "${SKIP_CONFIRMATION:-false}" != "true" ]]; then
        if ! confirm "Continue with remaining phases?"; then
          log_error "Setup aborted by user"
          print_summary
          exit 1
        fi
      fi
    fi
  done

  # Print summary
  print_summary

  # Exit with error if any phases failed
  if [[ ${#PHASES_FAILED[@]} -gt 0 ]]; then
    echo ""
    log_error "Setup completed with errors"
    log_error "Please review the failed phases and try again"
    exit 1
  fi

  # Success message
  echo ""
  log_success "CloudWatch setup completed successfully!"
  echo ""
  log_info "Next steps:"
  log_info "1. Check your email and confirm SNS subscriptions"
  log_info "2. View dashboards in CloudWatch console"
  log_info "3. Test alarms by triggering errors"
  log_info "4. Save Log Insights queries from: ${SCRIPT_DIR}/queries/saved-queries.md"
  echo ""
  log_info "Dashboard URLs:"
  log_info "- Production: https://console.aws.amazon.com/cloudwatch/home?region=${AWS_REGION}#dashboards:name=${PRODUCTION_DASHBOARD}"
  if [[ "${SETUP_STAGING:-false}" == "true" ]]; then
    log_info "- Staging: https://console.aws.amazon.com/cloudwatch/home?region=${AWS_REGION}#dashboards:name=${STAGING_DASHBOARD}"
  fi
  echo ""

  return 0
}

# ============================================================================
# Script Entry Point
# ============================================================================

main "$@"
