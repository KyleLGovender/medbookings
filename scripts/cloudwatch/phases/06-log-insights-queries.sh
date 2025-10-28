#!/usr/bin/env bash

# ============================================================================
# Phase 6: Generate Log Insights Query Reference
# ============================================================================
# Generates a reference file with useful CloudWatch Logs Insights queries.
# Note: AWS CLI doesn't support saving named queries, so this creates a
# markdown file with queries ready to copy-paste into the console.
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
  log_step "Phase 6: Generate Log Insights Query Reference"

  validate_prerequisites || exit 1
  validate_config || exit 1

  echo ""
  log_info "This phase will generate a reference file with useful Log Insights queries"
  log_info "AWS CLI doesn't support saving queries, so you'll need to manually save them in the console"
  echo ""

  # Generate query reference file
  local output_file="${SCRIPT_DIR}/../queries/saved-queries.md"
  generate_query_reference > "${output_file}"

  log_success "Generated query reference: ${output_file}"
  echo ""
  log_info "To save queries in CloudWatch:"
  log_info "1. Open CloudWatch Console → Logs → Insights"
  log_info "2. Select your log group"
  log_info "3. Copy a query from ${output_file}"
  log_info "4. Run the query, then click 'Actions' → 'Save query'"
  log_info "5. Name it and save to a folder (e.g., 'MedBookings/Production')"

  echo ""
  log_success "Phase 6 completed successfully"
  return 0
}

# ============================================================================
# Helper Functions
# ============================================================================

generate_query_reference() {
  cat <<'EOF'
# CloudWatch Logs Insights Queries for MedBookings

This file contains useful queries for debugging and monitoring. Copy these into CloudWatch Logs Insights and save them for quick access.

## How to Save Queries

1. Open [CloudWatch Console](https://console.aws.amazon.com/cloudwatch/)
2. Go to **Logs** → **Insights**
3. Select your log group from the dropdown
4. Copy a query below and paste it into the query editor
5. Click **Run query** to test it
6. Click **Actions** → **Save query**
7. Enter a name and folder (e.g., "MedBookings/Production")

---

## Error Analysis Queries

### Query 1: Top Error Messages (Last Hour)

**Purpose**: Identify the most common errors occurring in your application.

```
fields @timestamp, message, context.error.message, context.path, context.userId
| filter level = "error"
| stats count() as errorCount by context.error.message
| sort errorCount desc
| limit 10
```

**Save as**: `Top Errors Last Hour`
**Folder**: `MedBookings/Production`

---

### Query 2: Error Details with Stack Traces

**Purpose**: View detailed error information including stack traces.

```
fields @timestamp, message, context.error.name, context.error.message, context.error.stack, context.path
| filter level = "error"
| sort @timestamp desc
| limit 20
```

**Save as**: `Error Details with Stack Traces`
**Folder**: `MedBookings/Production`

---

### Query 3: Errors by Endpoint

**Purpose**: See which API endpoints are generating the most errors.

```
fields @timestamp, context.path, context.error.message
| filter level = "error" and ispresent(context.path)
| stats count() as errorCount by context.path
| sort errorCount desc
| limit 15
```

**Save as**: `Errors by Endpoint`
**Folder**: `MedBookings/Production`

---

## Performance Queries

### Query 4: Slow Requests (>2 seconds)

**Purpose**: Identify slow API requests that may need optimization.

```
fields @timestamp, message, context.path, context.durationMs, context.userId
| filter context.durationMs > 2000
| sort context.durationMs desc
| limit 20
```

**Save as**: `Slow Requests`
**Folder**: `MedBookings/Production`

---

### Query 5: API Endpoint Performance

**Purpose**: Analyze average and max response times for each endpoint.

```
fields context.path, context.durationMs
| filter message = "tRPC request completed"
| stats avg(context.durationMs) as avgDuration, max(context.durationMs) as maxDuration, count() as requestCount by context.path
| sort avgDuration desc
```

**Save as**: `API Performance`
**Folder**: `MedBookings/Production`

---

### Query 6: Request Volume by Endpoint

**Purpose**: See which endpoints receive the most traffic.

```
fields context.path
| filter message = "tRPC request completed"
| stats count() as requestCount by context.path
| sort requestCount desc
| limit 20
```

**Save as**: `Request Volume by Endpoint`
**Folder**: `MedBookings/Production`

---

## Authentication Queries

### Query 7: Authentication Events Timeline

**Purpose**: View all sign-in, sign-out, and authentication error events.

```
fields @timestamp, message, context.email, context.provider
| filter message like /sign-in|sign-out|Authentication error/
| sort @timestamp desc
```

**Save as**: `Auth Events`
**Folder**: `MedBookings/Production`

---

### Query 8: Failed Login Attempts

**Purpose**: Monitor failed authentication attempts (potential security issue).

```
fields @timestamp, message, context.email, context.error.message
| filter message like /Sign-in failed|sign-in blocked|Authentication error/
| sort @timestamp desc
| limit 50
```

**Save as**: `Failed Login Attempts`
**Folder**: `MedBookings/Production`

---

### Query 9: Authentication Failures by Email

**Purpose**: Identify users experiencing authentication issues.

```
fields context.email
| filter message like /Sign-in failed|Authentication error/
| stats count() as failureCount by context.email
| sort failureCount desc
| limit 20
```

**Save as**: `Auth Failures by User`
**Folder**: `MedBookings/Production`

---

## User-Specific Debugging

### Query 10: User-Specific Errors

**Purpose**: Debug errors for a specific user. Replace `USER_ID_HERE` with actual user ID.

```
fields @timestamp, message, context.error.message, context.path
| filter level = "error" and context.userId like /USER_ID_HERE/
| sort @timestamp desc
```

**Save as**: `User Errors (Template)`
**Folder**: `MedBookings/Production`

---

### Query 11: User Activity Timeline

**Purpose**: View all activity for a specific user. Replace `USER_ID_HERE` with actual user ID.

```
fields @timestamp, message, context.path, context.durationMs
| filter context.userId like /USER_ID_HERE/
| sort @timestamp desc
| limit 100
```

**Save as**: `User Activity Timeline (Template)`
**Folder**: `MedBookings/Production`

---

## Application Health Queries

### Query 12: Error Rate Over Time

**Purpose**: Visualize error rate trends (use with "Visualization" tab).

```
fields @timestamp
| filter level = "error"
| stats count() as errorCount by bin(5m)
```

**Save as**: `Error Rate Over Time`
**Folder**: `MedBookings/Production`

---

### Query 13: Recent Application Warnings

**Purpose**: View warnings that may indicate issues.

```
fields @timestamp, message, context
| filter level = "warn"
| sort @timestamp desc
| limit 50
```

**Save as**: `Recent Warnings`
**Folder**: `MedBookings/Production`

---

## Quick Search Templates

### Query 14: Search by Error Message

**Purpose**: Find errors containing specific text. Replace `SEARCH_TEXT` with your search term.

```
fields @timestamp, message, context.error.message, context.path
| filter level = "error" and (message like /SEARCH_TEXT/ or context.error.message like /SEARCH_TEXT/)
| sort @timestamp desc
| limit 50
```

**Save as**: `Search Errors (Template)`
**Folder**: `MedBookings/Production`

---

### Query 15: All Logs from Specific Endpoint

**Purpose**: View all logs (info, warn, error) for a specific endpoint.

```
fields @timestamp, level, message, context
| filter context.path = "/your/endpoint/path"
| sort @timestamp desc
| limit 100
```

**Save as**: `Endpoint Logs (Template)`
**Folder**: `MedBookings/Production`

---

## Tips for Using Logs Insights

1. **Time Range**: Always check the time range selector (top right)
2. **Visualization**: Click "Visualization" tab after running time-series queries
3. **Export**: Click "Actions" → "Copy query results" to export data
4. **Refresh**: Queries don't auto-refresh; click "Run query" to see new data
5. **Syntax**: Use `like` for pattern matching, `=` for exact matches
6. **Performance**: Add `limit` to queries to improve performance

---

## Next Steps

After saving these queries:
1. Test each query with your log group
2. Adjust time ranges and limits as needed
3. Create dashboards combining multiple queries
4. Set up scheduled queries for regular reports (CloudWatch Insights feature)

For more information on query syntax:
https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/CWL_QuerySyntax.html
EOF
}

# ============================================================================
# Script Entry Point
# ============================================================================

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  main "$@"
fi
