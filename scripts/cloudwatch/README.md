# AWS CloudWatch Setup Automation for MedBookings

This directory contains automation scripts to set up AWS CloudWatch monitoring for the MedBookings application deployed on AWS Amplify.

## 📋 Overview

These scripts automate ~90% of the CloudWatch setup process described in `/docs/CLOUDWATCH_SETUP.md`, saving approximately **2.5 hours of manual configuration** per environment.

### What Gets Automated

- ✅ CloudWatch log retention policies
- ✅ Metric filters for error tracking
- ✅ SNS topics and email subscriptions
- ✅ CloudWatch alarms with thresholds
- ✅ Monitoring dashboards
- ✅ Amplify environment variables
- ✅ Log Insights query generation

### What Requires Manual Steps

- ⚠️ Email subscription confirmation (AWS security requirement)
- ⚠️ Saving Log Insights queries (AWS CLI limitation)

## 🚀 Quick Start

### 1. Prerequisites

Install required tools:

```bash
# macOS
brew install awscli jq

# Linux (Ubuntu/Debian)
apt-get install awscli jq

# Verify installations
aws --version  # Should be v2.x
jq --version
```

Configure AWS credentials:

```bash
aws configure
# Enter your AWS Access Key ID
# Enter your AWS Secret Access Key
# Default region: eu-west-1 (or your region)
# Default output format: json
```

### 2. Configuration

Copy the configuration template and customize it:

```bash
cd scripts/cloudwatch
cp config.example.sh config.sh
```

Edit `config.sh` with your values:

```bash
# Required settings
AWS_REGION="eu-west-1"                    # Your AWS region
AMPLIFY_APP_ID="your-app-id-here"        # From Amplify console URL
PRODUCTION_ALERT_EMAIL="team@example.com" # Your team email

# Optional settings
STAGING_BRANCH="staging"                  # Leave empty to skip staging
SETUP_STAGING=true                        # Set to false to skip staging
```

**Finding your Amplify App ID:**
1. Open [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
2. Click on your MedBookings app
3. Copy the App ID from the URL: `https://console.aws.amazon.com/amplify/home?region=eu-west-1#/d123abc456xyz`
   - App ID is: `d123abc456xyz`

### 3. Run Setup

Run the full automated setup:

```bash
./setup-cloudwatch.sh
```

The script will:
1. Validate prerequisites and configuration
2. Show what will be created
3. Ask for confirmation
4. Execute all 7 phases
5. Provide next steps and dashboard URLs

## 📝 Usage Examples

### Run All Phases Interactively

```bash
./setup-cloudwatch.sh
```

### Run Specific Phases

```bash
# Just create metric filters and alarms
./setup-cloudwatch.sh --phase 02-metric-filters --phase 04-alarms
```

### Preview Without Making Changes

```bash
./setup-cloudwatch.sh --dry-run
```

### Run in CI/CD Mode

```bash
./setup-cloudwatch.sh --non-interactive --all
```

### Force Recreate Existing Resources

```bash
./setup-cloudwatch.sh --force
```

## 📊 The 7 Phases

### Phase 1: Log Retention Policies
- Sets retention to 30 days for production (compliance)
- Sets retention to 7 days for staging (cost optimization)
- **Time**: 2-3 minutes
- **Cost**: ~$0.06/GB/month (production), ~$0.02/GB/month (staging)

### Phase 2: Metric Filters
- Creates `ServerErrors` filter (all error-level logs)
- Creates `AuthenticationFailures` filter (failed sign-ins)
- Creates `TRPCErrors` filter (failed API requests)
- **Time**: 3-5 minutes
- **Cost**: Free (no additional charges)

### Phase 3: SNS Topics & Subscriptions
- Creates SNS topics for alerts
- Subscribes email addresses
- **Requires**: Email confirmation (check inbox)
- **Time**: 2-3 minutes
- **Cost**: Free for email (first 1,000 notifications)

### Phase 4: CloudWatch Alarms
- High Server Error Rate (>10 errors in 5 minutes)
- Authentication Failures (>5 failures in 5 minutes)
- Sustained Errors (>3 errors across 3 consecutive periods)
- **Time**: 3-5 minutes
- **Cost**: $0.10/alarm/month (~$0.30-0.60/month total)

### Phase 5: Monitoring Dashboards
- Server error trends (line graph)
- Authentication activity (line graph)
- Latest errors (log table)
- Error counts (single value widgets)
- **Time**: 2-3 minutes
- **Cost**: Free (first 3 dashboards)

### Phase 6: Log Insights Queries
- Generates markdown file with 15 useful queries
- Top errors, slow requests, auth events, etc.
- **Manual Step**: Copy-paste queries into CloudWatch console and save
- **Time**: 1 minute (generation) + 10 minutes (manual saving)
- **Cost**: $0.005/GB scanned (only when running queries)

### Phase 7: Amplify Environment Variables
- Sets `LOG_LEVEL=info` (production) or `debug` (staging)
- Sets `NODE_ENV=production` or `staging`
- Optionally triggers redeployment
- **Time**: 2-3 minutes
- **Cost**: Free

**Total Time**: 15-25 minutes (vs 2-3 hours manual)
**Total Cost**: ~$2-3/month for both environments

## ⚙️ Configuration Options

### Email Alerts

```bash
PRODUCTION_ALERT_EMAIL="team@example.com"   # Team email for production
STAGING_ALERT_EMAIL="dev@example.com"       # Dev email for staging
```

### Alarm Thresholds

Adjust these based on your traffic:

```bash
HIGH_ERROR_THRESHOLD=10           # Errors in 5 minutes
AUTH_FAILURE_THRESHOLD=5          # Auth failures in 5 minutes
SUSTAINED_ERROR_THRESHOLD=3       # Sustained error threshold
```

### Log Retention

```bash
PRODUCTION_RETENTION_DAYS=30      # 30 days (compliance)
STAGING_RETENTION_DAYS=7          # 7 days (cost savings)
```

### Auto-Deployment

```bash
AUTO_REDEPLOY=false               # Set to true to auto-deploy after env var changes
```

## 🔧 Troubleshooting

### Issue: "AWS CLI is not authenticated"

**Solution:**
```bash
aws configure
# Or set environment variables:
export AWS_ACCESS_KEY_ID="your-key"
export AWS_SECRET_ACCESS_KEY="your-secret"
export AWS_DEFAULT_REGION="eu-west-1"
```

### Issue: "Log group not found"

**Cause**: Server-side logging not enabled in AWS Amplify.

**Solution:**
1. Open [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
2. Select your MedBookings app
3. Go to **App settings** → **Monitoring**
4. Toggle **Enable server-side logging** to ON
5. Wait 5-10 minutes for log groups to appear
6. Re-run the setup script

### Issue: "Permission denied" errors

**Cause**: IAM user/role lacks required permissions.

**Solution**: Attach this policy to your IAM user/role:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "logs:DescribeLogGroups",
        "logs:PutRetentionPolicy",
        "logs:PutMetricFilter",
        "cloudwatch:PutMetricAlarm",
        "cloudwatch:PutDashboard",
        "sns:CreateTopic",
        "sns:Subscribe",
        "sns:ListTopics",
        "amplify:GetBranch",
        "amplify:UpdateBranch",
        "amplify:StartJob"
      ],
      "Resource": "*"
    }
  ]
}
```

### Issue: "jq: command not found"

**Solution:**
```bash
# macOS
brew install jq

# Linux (Ubuntu/Debian)
sudo apt-get install jq

# Linux (RHEL/CentOS)
sudo yum install jq
```

### Issue: SNS subscription "Pending Confirmation"

**Cause**: Email confirmation link not clicked.

**Solution:**
1. Check the email inbox for PRODUCTION_ALERT_EMAIL
2. Look for email from "AWS Notifications"
3. Click "Confirm subscription" link
4. Re-run Phase 3 or full setup if needed

### Issue: Metric filters not working

**Symptoms**: No data in dashboards, alarms stuck in "Insufficient Data".

**Causes & Solutions:**

1. **Logs not flowing**
   - Check if server-side logging is enabled in Amplify
   - Verify application is logging with enhanced logger
   - Check CloudWatch log groups have recent entries

2. **Filter pattern mismatch**
   - Logs must be in JSON format (production)
   - Check log structure matches filter patterns
   - Test filter in CloudWatch console

3. **Wait for data**
   - Metrics can take 5-10 minutes to populate
   - Trigger some errors to generate data
   - Check "Metrics" section in CloudWatch console

### Issue: Dashboard shows no data

**Solution:**
1. Check metric filters are creating data (CloudWatch → Metrics)
2. Adjust dashboard time range (top right in dashboard)
3. Verify log group has recent entries
4. Trigger some activity/errors in the application

## 📂 Directory Structure

```
scripts/cloudwatch/
├── setup-cloudwatch.sh          # Main orchestrator script
├── config.example.sh            # Configuration template
├── config.sh                    # Your config (gitignored)
├── README.md                    # This file
├── lib/
│   └── utils.sh                 # Shared utility functions
├── phases/
│   ├── 01-log-retention.sh
│   ├── 02-metric-filters.sh
│   ├── 03-sns-topics.sh
│   ├── 04-alarms.sh
│   ├── 05-dashboard.sh
│   ├── 06-log-insights-queries.sh
│   └── 07-amplify-env-vars.sh
├── dashboards/
│   └── (generated dashboard configs)
└── queries/
    └── saved-queries.md         # Log Insights query reference
```

## 🔍 Testing the Setup

### 1. Verify Log Groups Exist

```bash
aws logs describe-log-groups \
  --log-group-name-prefix "/aws/amplify/${AMPLIFY_APP_ID}" \
  --region eu-west-1
```

### 2. Trigger Test Errors

Visit your application and trigger some errors to test:
- Try signing in with invalid credentials (test auth failures)
- Access a non-existent page (test server errors)
- Call an invalid API endpoint (test tRPC errors)

### 3. Check Metrics

```bash
# View ServerErrors metric
aws cloudwatch get-metric-statistics \
  --namespace "MedBookings/Production" \
  --metric-name ServerErrors \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum \
  --region eu-west-1
```

### 4. Test Alarms

Trigger enough errors to exceed threshold and verify:
1. Alarm state changes to "In Alarm"
2. Email notification received
3. Dashboard shows the spike

### 5. View Dashboard

Open the dashboard URL provided after setup:
```
https://console.aws.amazon.com/cloudwatch/home?region=eu-west-1#dashboards:name=MedBookings-Production
```

## 🔐 Security Considerations

### Sensitive Data

- `config.sh` is gitignored (contains email addresses)
- Never commit AWS credentials to git
- Use IAM roles for CI/CD instead of access keys

### Email Notifications

- SNS subscriptions require explicit confirmation
- Emails may contain error messages (sanitized for PHI)
- Consider using team distribution lists

### IAM Permissions

- Follow principle of least privilege
- Use IAM roles for Amplify deployments
- Restrict CloudWatch access to specific resources

## 💰 Cost Breakdown

| Service | Usage | Cost |
|---------|-------|------|
| CloudWatch Logs | First 5 GB/month | Free |
| CloudWatch Logs | $0.50/GB after 5 GB | Variable |
| Log Retention | $0.03/GB/month | ~$0.06-0.15/month |
| CloudWatch Metrics | 10 custom metrics | Free (< 10,000) |
| CloudWatch Alarms | 3 alarms per environment | $0.30-0.60/month |
| CloudWatch Dashboards | 2 dashboards | Free (first 3) |
| SNS Email | 1,000 notifications/month | Free |
| Logs Insights Queries | $0.005/GB scanned | On-demand |

**Estimated Total**: $2-3/month for both production and staging

## 📚 Related Documentation

- [Main CloudWatch Setup Guide](/docs/CLOUDWATCH_SETUP.md) - Manual setup instructions
- [AWS CloudWatch Documentation](https://docs.aws.amazon.com/cloudwatch/)
- [AWS Amplify Monitoring](https://docs.aws.amazon.com/amplify/latest/userguide/access-logs.html)
- [CloudWatch Logs Insights](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/CWL_QuerySyntax.html)

## 🆘 Getting Help

If you encounter issues:

1. Check the troubleshooting section above
2. Review `/docs/CLOUDWATCH_SETUP.md` for manual setup instructions
3. Check AWS CloudWatch service health
4. Verify IAM permissions
5. Review script logs for error details

## 🔄 Maintenance

### Updating Alarm Thresholds

Edit `config.sh` and re-run Phase 4:

```bash
./setup-cloudwatch.sh --phase 04-alarms --force
```

### Adding New Metric Filters

1. Edit `phases/02-metric-filters.sh`
2. Add new filter using `create_metric_filter` function
3. Re-run Phase 2:
```bash
./setup-cloudwatch.sh --phase 02-metric-filters --force
```

### Updating Dashboards

1. Modify dashboard JSON in `phases/05-dashboard.sh`
2. Re-run Phase 5:
```bash
./setup-cloudwatch.sh --phase 05-dashboard --force
```

## 📝 Script Versions

- **v1.0.0** (Current) - Initial release with 7 automated phases

---

**Generated with** ♥️ **for MedBookings**
