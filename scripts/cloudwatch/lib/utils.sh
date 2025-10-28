#!/usr/bin/env bash

# ============================================================================
# Shared Utility Functions for CloudWatch Automation
# ============================================================================

# ----------------------------------------------------------------------------
# Colors and Formatting
# ----------------------------------------------------------------------------

# Color codes (if terminal supports colors)
if [[ -t 1 ]] && command -v tput >/dev/null 2>&1; then
  COLOR_RESET=$(tput sgr0)
  COLOR_RED=$(tput setaf 1)
  COLOR_GREEN=$(tput setaf 2)
  COLOR_YELLOW=$(tput setaf 3)
  COLOR_BLUE=$(tput setaf 4)
  COLOR_MAGENTA=$(tput setaf 5)
  COLOR_CYAN=$(tput setaf 6)
  COLOR_BOLD=$(tput bold)
else
  COLOR_RESET=""
  COLOR_RED=""
  COLOR_GREEN=""
  COLOR_YELLOW=""
  COLOR_BLUE=""
  COLOR_MAGENTA=""
  COLOR_CYAN=""
  COLOR_BOLD=""
fi

# ----------------------------------------------------------------------------
# Logging Functions
# ----------------------------------------------------------------------------

log_info() {
  echo "${COLOR_BLUE}[INFO]${COLOR_RESET} $*"
}

log_success() {
  echo "${COLOR_GREEN}[SUCCESS]${COLOR_RESET} $*"
}

log_warning() {
  echo "${COLOR_YELLOW}[WARNING]${COLOR_RESET} $*"
}

log_error() {
  echo "${COLOR_RED}[ERROR]${COLOR_RESET} $*" >&2
}

log_debug() {
  if [[ ${VERBOSITY:-1} -ge 2 ]]; then
    echo "${COLOR_CYAN}[DEBUG]${COLOR_RESET} $*"
  fi
}

log_step() {
  echo ""
  echo "${COLOR_BOLD}${COLOR_MAGENTA}==>${COLOR_RESET} ${COLOR_BOLD}$*${COLOR_RESET}"
}

# ----------------------------------------------------------------------------
# Validation Functions
# ----------------------------------------------------------------------------

# Check if a command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Validate prerequisites
validate_prerequisites() {
  local missing_deps=()

  # Check AWS CLI
  if ! command_exists aws; then
    missing_deps+=("aws-cli")
  fi

  # Check jq
  if ! command_exists jq; then
    missing_deps+=("jq")
  fi

  if [[ ${#missing_deps[@]} -gt 0 ]]; then
    log_error "Missing required dependencies: ${missing_deps[*]}"
    log_error "Please install missing dependencies and try again"
    return 1
  fi

  # Check AWS CLI authentication
  if ! aws sts get-caller-identity >/dev/null 2>&1; then
    log_error "AWS CLI is not authenticated"
    log_error "Please run 'aws configure' or set AWS credentials"
    return 1
  fi

  log_success "Prerequisites validated"
  return 0
}

# Validate configuration file
validate_config() {
  if [[ -z "${CONFIG_LOADED:-}" ]]; then
    log_error "Configuration not loaded"
    log_error "Make sure config.sh exists and is sourced"
    return 1
  fi

  local required_vars=(
    "AWS_REGION"
    "AMPLIFY_APP_ID"
    "PRODUCTION_BRANCH"
    "PRODUCTION_LOG_GROUP"
    "PRODUCTION_ALERT_EMAIL"
    "APP_NAME"
  )

  local missing_vars=()
  for var in "${required_vars[@]}"; do
    if [[ -z "${!var:-}" ]]; then
      missing_vars+=("$var")
    fi
  done

  if [[ ${#missing_vars[@]} -gt 0 ]]; then
    log_error "Missing required configuration variables: ${missing_vars[*]}"
    log_error "Please check your config.sh file"
    return 1
  fi

  # Validate email format
  if [[ ! "${PRODUCTION_ALERT_EMAIL}" =~ ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]]; then
    log_error "Invalid email address: ${PRODUCTION_ALERT_EMAIL}"
    return 1
  fi

  log_success "Configuration validated"
  return 0
}

# ----------------------------------------------------------------------------
# AWS Helper Functions
# ----------------------------------------------------------------------------

# Check if log group exists
log_group_exists() {
  local log_group="$1"

  if aws logs describe-log-groups \
    --log-group-name-prefix "${log_group}" \
    --region "${AWS_REGION}" \
    --query "logGroups[?logGroupName=='${log_group}'].logGroupName" \
    --output text 2>/dev/null | grep -q "${log_group}"; then
    return 0
  else
    return 1
  fi
}

# Check if metric filter exists
metric_filter_exists() {
  local log_group="$1"
  local filter_name="$2"

  if aws logs describe-metric-filters \
    --log-group-name "${log_group}" \
    --filter-name-prefix "${filter_name}" \
    --region "${AWS_REGION}" \
    --query "metricFilters[?filterName=='${filter_name}'].filterName" \
    --output text 2>/dev/null | grep -q "${filter_name}"; then
    return 0
  else
    return 1
  fi
}

# Check if SNS topic exists
sns_topic_exists() {
  local topic_name="$1"

  if aws sns list-topics \
    --region "${AWS_REGION}" \
    --query "Topics[?contains(TopicArn, '${topic_name}')].TopicArn" \
    --output text 2>/dev/null | grep -q "${topic_name}"; then
    return 0
  else
    return 1
  fi
}

# Get SNS topic ARN by name
get_sns_topic_arn() {
  local topic_name="$1"

  aws sns list-topics \
    --region "${AWS_REGION}" \
    --query "Topics[?contains(TopicArn, '${topic_name}')].TopicArn" \
    --output text 2>/dev/null | head -n 1
}

# Check if CloudWatch alarm exists
alarm_exists() {
  local alarm_name="$1"

  if aws cloudwatch describe-alarms \
    --alarm-names "${alarm_name}" \
    --region "${AWS_REGION}" \
    --query "MetricAlarms[?AlarmName=='${alarm_name}'].AlarmName" \
    --output text 2>/dev/null | grep -q "${alarm_name}"; then
    return 0
  else
    return 1
  fi
}

# Check if dashboard exists
dashboard_exists() {
  local dashboard_name="$1"

  if aws cloudwatch get-dashboard \
    --dashboard-name "${dashboard_name}" \
    --region "${AWS_REGION}" \
    >/dev/null 2>&1; then
    return 0
  else
    return 1
  fi
}

# ----------------------------------------------------------------------------
# Confirmation Prompts
# ----------------------------------------------------------------------------

# Ask for user confirmation
confirm() {
  local prompt="$1"
  local default="${2:-n}"

  if [[ "${SKIP_CONFIRMATION:-false}" == "true" ]]; then
    return 0
  fi

  local yn
  if [[ "${default}" == "y" ]]; then
    read -p "${prompt} [Y/n] " -n 1 -r yn
  else
    read -p "${prompt} [y/N] " -n 1 -r yn
  fi
  echo

  [[ -z "${yn}" ]] && yn="${default}"
  [[ "${yn}" =~ ^[Yy]$ ]]
}

# ----------------------------------------------------------------------------
# Dry Run Support
# ----------------------------------------------------------------------------

# Execute command or print in dry-run mode
run_command() {
  local description="$1"
  shift

  if [[ "${DRY_RUN:-false}" == "true" ]]; then
    log_info "[DRY RUN] ${description}"
    log_debug "Command: $*"
    return 0
  else
    log_debug "Executing: $*"
    if "$@"; then
      log_success "${description}"
      return 0
    else
      log_error "Failed: ${description}"
      return 1
    fi
  fi
}

# ----------------------------------------------------------------------------
# Progress Tracking
# ----------------------------------------------------------------------------

# Track phase execution
PHASES_COMPLETED=()
PHASES_FAILED=()

mark_phase_completed() {
  local phase="$1"
  PHASES_COMPLETED+=("${phase}")
}

mark_phase_failed() {
  local phase="$1"
  PHASES_FAILED+=("${phase}")
}

# Print execution summary
print_summary() {
  echo ""
  echo "${COLOR_BOLD}=================================${COLOR_RESET}"
  echo "${COLOR_BOLD}Execution Summary${COLOR_RESET}"
  echo "${COLOR_BOLD}=================================${COLOR_RESET}"

  if [[ ${#PHASES_COMPLETED[@]} -gt 0 ]]; then
    echo ""
    echo "${COLOR_GREEN}${COLOR_BOLD}Completed Phases (${#PHASES_COMPLETED[@]}):${COLOR_RESET}"
    for phase in "${PHASES_COMPLETED[@]}"; do
      echo "  ${COLOR_GREEN}✓${COLOR_RESET} ${phase}"
    done
  fi

  if [[ ${#PHASES_FAILED[@]} -gt 0 ]]; then
    echo ""
    echo "${COLOR_RED}${COLOR_BOLD}Failed Phases (${#PHASES_FAILED[@]}):${COLOR_RESET}"
    for phase in "${PHASES_FAILED[@]}"; do
      echo "  ${COLOR_RED}✗${COLOR_RESET} ${phase}"
    done
  fi

  echo ""
  echo "${COLOR_BOLD}=================================${COLOR_RESET}"
}

# ----------------------------------------------------------------------------
# Error Handling
# ----------------------------------------------------------------------------

# Cleanup on error
cleanup_on_error() {
  log_error "Script failed. Cleaning up..."
  print_summary
}

# Set up error handling
setup_error_handling() {
  set -euo pipefail
  trap cleanup_on_error ERR
}

# ----------------------------------------------------------------------------
# Configuration Display
# ----------------------------------------------------------------------------

# Display current configuration
show_config() {
  echo ""
  echo "${COLOR_BOLD}Current Configuration:${COLOR_RESET}"
  echo "  AWS Region:          ${AWS_REGION}"
  echo "  Amplify App ID:      ${AMPLIFY_APP_ID}"
  echo "  Production Branch:   ${PRODUCTION_BRANCH}"
  echo "  Production Email:    ${PRODUCTION_ALERT_EMAIL}"
  if [[ "${SETUP_STAGING:-false}" == "true" ]]; then
    echo "  Staging Branch:      ${STAGING_BRANCH}"
    echo "  Staging Email:       ${STAGING_ALERT_EMAIL}"
  fi
  echo "  Dry Run:             ${DRY_RUN:-false}"
  echo "  Force Mode:          ${FORCE:-false}"
  echo ""
}

# ----------------------------------------------------------------------------
# Version Information
# ----------------------------------------------------------------------------

UTILS_VERSION="1.0.0"

show_version() {
  echo "CloudWatch Automation Utils v${UTILS_VERSION}"
}
