#!/usr/bin/env bash

# ============================================================================
# Phase 5: Create CloudWatch Dashboards
# ============================================================================
# Creates CloudWatch dashboards for visualizing application health:
# - Server error trends
# - Authentication activity
# - Latest error logs
# - Performance metrics
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
  log_step "Phase 5: Create CloudWatch Dashboards"

  validate_prerequisites || exit 1
  validate_config || exit 1

  echo ""
  log_info "This phase will create CloudWatch dashboards for monitoring"
  echo ""

  # Create production dashboard
  create_dashboard \
    "Production" \
    "${PRODUCTION_DASHBOARD}" \
    "${PRODUCTION_LOG_GROUP}" \
    "${PRODUCTION_NAMESPACE}"

  # Create staging dashboard if enabled
  if [[ "${SETUP_STAGING:-false}" == "true" ]]; then
    create_dashboard \
      "Staging" \
      "${STAGING_DASHBOARD}" \
      "${STAGING_LOG_GROUP}" \
      "${STAGING_NAMESPACE}"
  fi

  echo ""
  log_success "Phase 5 completed successfully"
  return 0
}

# ============================================================================
# Helper Functions
# ============================================================================

create_dashboard() {
  local environment="$1"
  local dashboard_name="$2"
  local log_group="$3"
  local namespace="$4"

  log_info "Creating ${environment} dashboard: ${dashboard_name}..."

  # Check if dashboard already exists
  if dashboard_exists "${dashboard_name}"; then
    if [[ "${FORCE:-false}" != "true" ]]; then
      log_warning "Dashboard already exists: ${dashboard_name}"
      if ! confirm "Recreate dashboard?"; then
        log_info "Skipping ${dashboard_name}"
        return 0
      fi
    fi
  fi

  # Generate dashboard JSON
  local dashboard_body
  dashboard_body=$(generate_dashboard_json "${environment}" "${log_group}" "${namespace}")

  # Create dashboard
  run_command \
    "Create dashboard: ${dashboard_name}" \
    aws cloudwatch put-dashboard \
      --dashboard-name "${dashboard_name}" \
      --dashboard-body "${dashboard_body}" \
      --region "${AWS_REGION}"

  log_success "Created: ${dashboard_name}"
  log_info "View at: https://console.aws.amazon.com/cloudwatch/home?region=${AWS_REGION}#dashboards:name=${dashboard_name}"
  return 0
}

generate_dashboard_json() {
  local environment="$1"
  local log_group="$2"
  local namespace="$3"

  cat <<EOF
{
  "widgets": [
    {
      "type": "metric",
      "width": 12,
      "height": 6,
      "properties": {
        "metrics": [
          ["${namespace}", "ServerErrors", {"stat": "Sum", "label": "Server Errors"}]
        ],
        "view": "timeSeries",
        "stacked": false,
        "region": "${AWS_REGION}",
        "title": "Server Errors (Last 3 Hours)",
        "period": 300,
        "yAxis": {
          "left": {
            "min": 0
          }
        }
      }
    },
    {
      "type": "metric",
      "width": 12,
      "height": 6,
      "properties": {
        "metrics": [
          ["${namespace}", "AuthenticationFailures", {"stat": "Sum", "label": "Auth Failures"}],
          [".", "TRPCErrors", {"stat": "Sum", "label": "tRPC Errors"}]
        ],
        "view": "timeSeries",
        "stacked": false,
        "region": "${AWS_REGION}",
        "title": "Authentication & API Errors (Last 3 Hours)",
        "period": 300,
        "yAxis": {
          "left": {
            "min": 0
          }
        }
      }
    },
    {
      "type": "log",
      "width": 24,
      "height": 6,
      "properties": {
        "query": "SOURCE '${log_group}' | fields @timestamp, level, message, context.error.message, context.path\\n| filter level = \\"error\\"\\n| sort @timestamp desc\\n| limit 20",
        "region": "${AWS_REGION}",
        "stacked": false,
        "title": "Latest Errors",
        "view": "table"
      }
    },
    {
      "type": "metric",
      "width": 8,
      "height": 6,
      "properties": {
        "metrics": [
          ["${namespace}", "ServerErrors", {"stat": "Sum", "label": "Server Errors"}]
        ],
        "view": "singleValue",
        "region": "${AWS_REGION}",
        "title": "Server Errors (Last Hour)",
        "period": 3600
      }
    },
    {
      "type": "metric",
      "width": 8,
      "height": 6,
      "properties": {
        "metrics": [
          ["${namespace}", "AuthenticationFailures", {"stat": "Sum", "label": "Auth Failures"}]
        ],
        "view": "singleValue",
        "region": "${AWS_REGION}",
        "title": "Auth Failures (Last Hour)",
        "period": 3600
      }
    },
    {
      "type": "metric",
      "width": 8,
      "height": 6,
      "properties": {
        "metrics": [
          ["${namespace}", "TRPCErrors", {"stat": "Sum", "label": "tRPC Errors"}]
        ],
        "view": "singleValue",
        "region": "${AWS_REGION}",
        "title": "tRPC Errors (Last Hour)",
        "period": 3600
      }
    }
  ]
}
EOF
}

# ============================================================================
# Script Entry Point
# ============================================================================

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  main "$@"
fi
