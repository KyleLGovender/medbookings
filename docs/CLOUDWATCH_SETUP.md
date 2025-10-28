# AWS CloudWatch Setup Guide for MedBookings

This guide walks you through configuring AWS CloudWatch monitoring for the MedBookings application deployed on AWS Amplify.

**Estimated Time**: 2-3 hours
**Cost**: ~$2-3/month for both production and staging

---

## Prerequisites

- AWS account with access to Amplify Console
- IAM permissions for CloudWatch Logs, Alarms, and SNS
- MedBookings application deployed on AWS Amplify
- Code changes from this commit deployed (includes enhanced logging)

---

## Phase 1: Enable CloudWatch Logs in AWS Amplify

### Step 1: Access Amplify Monitoring Settings

1. Open [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
2. Select your **MedBookings** application
3. In the left sidebar, click **App settings** → **Monitoring**

### Step 2: Enable Server-Side Logging

1. Scroll to **Server-side logging** section
2. Toggle **Enable server-side logging** to ON
3. Click **Save** to apply changes

**What this does**: AWS Amplify will automatically capture all `console.log`, `console.error`, and `console.warn` output from your Next.js application and send it to CloudWatch.

### Step 3: Verify Log Groups Created

1. Open [CloudWatch Console](https://console.aws.amazon.com/cloudwatch/)
2. In the left sidebar, click **Logs** → **Log groups**
3. Look for log groups matching this pattern:
   ```
   /aws/amplify/[app-id]/master/server        (Production)
   /aws/amplify/[app-id]/staging/server       (Staging, if applicable)
   ```

**Note**: Log groups may take 5-10 minutes to appear after enabling server-side logging.

### Step 4: Set Log Retention Policies

For each log group:

1. Click on the log group name
2. Click **Actions** → **Edit retention setting**
3. Set retention period:
   - **Production**: 30 days (recommended for compliance)
   - **Staging**: 7 days (cost optimization)
4. Click **Save**

**Cost Impact**:

- Production: ~$0.06/GB/month for storage
- Staging: ~$0.02/GB/month for storage

---

## Phase 2: Create CloudWatch Metric Filters

Metric filters extract specific patterns from logs and convert them to CloudWatch metrics for alerting.

### Metric Filter 1: Server-Side Errors

1. Go to **CloudWatch Console** → **Log groups**
2. Select your production log group: `/aws/amplify/[app-id]/master/server`
3. Click **Actions** → **Create metric filter**

**Filter pattern**:

```
{ $.level = "error" }
```

**Test pattern**: Click "Test pattern" and paste a sample log entry to verify it matches

**Metric details**:

- Click **Next**
- **Filter name**: `ServerErrors`
- **Metric namespace**: `MedBookings/Production`
- **Metric name**: `ServerErrors`
- **Metric value**: `1`
- **Default value**: `0` (important: prevents missing data points)
- **Unit**: Count
- Click **Next** → **Create metric filter**

**Repeat for staging** environment with namespace `MedBookings/Staging`.

### Metric Filter 2: Authentication Failures

1. Select production log group
2. Click **Actions** → **Create metric filter**

**Filter pattern**:

```
{ $.message = "*Sign-in failed*" || $.message = "*Authentication error*" || $.message = "*sign-in blocked*" }
```

**Metric details**:

- **Filter name**: `AuthenticationFailures`
- **Metric namespace**: `MedBookings/Production`
- **Metric name**: `AuthenticationFailures`
- **Metric value**: `1`
- **Default value**: `0`
- **Unit**: Count

### Metric Filter 3: tRPC Request Failures

1. Select production log group
2. Click **Actions** → **Create metric filter**

**Filter pattern**:

```
{ $.message = "tRPC request failed" }
```

**Metric details**:

- **Filter name**: `TRPCErrors`
- **Metric namespace**: `MedBookings/Production`
- **Metric name**: `TRPCErrors`
- **Metric value**: `1`
- **Default value**: `0`
- **Unit**: Count

---

## Phase 3: Create CloudWatch Alarms

CloudWatch Alarms notify you when specific conditions are met (e.g., too many errors).

### Step 1: Create SNS Topic for Notifications

1. Open [SNS Console](https://console.aws.amazon.com/sns/)
2. Click **Topics** → **Create topic**
3. Configure:
   - **Type**: Standard
   - **Name**: `medbookings-production-alerts`
   - **Display name**: MedBookings Production
4. Click **Create topic**
5. Copy the **ARN** (you'll need this for alarms)

### Step 2: Create Email Subscription

1. Click **Create subscription**
2. Configure:
   - **Protocol**: Email
   - **Endpoint**: your-email@example.com (your team email)
3. Click **Create subscription**
4. **Check your email** and click the confirmation link

**Repeat** for staging: Create `medbookings-staging-alerts` topic and subscription.

### Step 3: Create Alarm - High Server Error Rate

1. Go to **CloudWatch Console** → **Alarms** → **Create alarm**
2. Click **Select metric**
3. Navigate to: **Custom namespaces** → **MedBookings/Production** → **Metrics with no dimensions**
4. Select **ServerErrors** metric → Click **Select metric**

**Configure alarm**:

- **Statistic**: Sum
- **Period**: 5 minutes
- **Threshold type**: Static
- **Whenever ServerErrors is**: Greater than `10`
- Click **Next**

**Configure actions**:

- **Alarm state trigger**: In alarm
- **Send notification to**: medbookings-production-alerts (select from dropdown)
- Click **Next**

**Name and description**:

- **Alarm name**: `MedBookings-Production-HighServerErrors`
- **Alarm description**: Triggers when more than 10 server errors occur in 5 minutes
- Click **Next** → **Create alarm**

### Step 4: Create Alarm - Authentication Failures

Follow the same process as above, but:

- **Metric**: `AuthenticationFailures`
- **Threshold**: Greater than `5`
- **Alarm name**: `MedBookings-Production-AuthFailures`
- **Description**: Triggers when more than 5 authentication failures occur in 5 minutes

### Step 5: Create Alarm - Sustained Error Rate

For detecting persistent issues:

- **Metric**: `ServerErrors`
- **Threshold**: Greater than `3`
- **Period**: 5 minutes
- **Datapoints to alarm**: 3 out of 3 (must be high for 15 minutes)
- **Alarm name**: `MedBookings-Production-SustainedErrors`

---

## Phase 4: Create CloudWatch Dashboard

Dashboards provide a visual overview of your application's health.

### Step 1: Create Production Dashboard

1. Go to **CloudWatch Console** → **Dashboards** → **Create dashboard**
2. **Dashboard name**: `MedBookings-Production`
3. Click **Create dashboard**

### Step 2: Add Widgets

Click **Add widget** and add the following:

#### Widget 1: Server Errors (Line Graph)

- **Widget type**: Line
- **Data sources**: CloudWatch
- **Metric**: `MedBookings/Production` → `ServerErrors`
- **Statistic**: Sum
- **Period**: 5 minutes
- **Widget title**: Server Errors (Last 3 Hours)
- Click **Create widget**

#### Widget 2: Error Rate Percentage (Number)

- **Widget type**: Number
- **Metric math expression**: `(m1/m2)*100`
  - m1: `ServerErrors` (Sum, 5 min)
  - m2: `TRPCRequests` (Sum, 5 min) - _Note: You'll need to create this metric filter first_
- **Widget title**: Error Rate %
- Click **Create widget**

#### Widget 3: Latest Errors (Logs)

- **Widget type**: Logs table
- **Log groups**: Select your production log group
- **Query**:

```
fields @timestamp, level, message, context.error.message, context.path
| filter level = "error"
| sort @timestamp desc
| limit 20
```

- **Widget title**: Latest Errors
- Click **Create widget**

#### Widget 4: Authentication Activity (Line Graph)

- **Widget type**: Line
- Add two metrics:
  - `MedBookings/Production` → `AuthenticationFailures`
  - Create additional metric filter for successful logins if needed
- **Widget title**: Authentication Activity
- Click **Create widget**

### Step 3: Save Dashboard

1. Click **Save dashboard** in the top right
2. Your dashboard is now available at: CloudWatch → Dashboards → MedBookings-Production

### Step 4: Create Staging Dashboard

Repeat the process above for staging environment with namespace `MedBookings/Staging`.

---

## Phase 5: CloudWatch Logs Insights Queries

Save useful queries for quick debugging.

### Step 1: Access Logs Insights

1. Go to **CloudWatch Console** → **Logs** → **Insights**
2. Select your production log group from the dropdown

### Step 2: Create and Save Queries

#### Query 1: Top Error Messages (Last Hour)

```
fields @timestamp, message, context.error.message, context.path, context.userId
| filter level = "error"
| stats count() as errorCount by context.error.message
| sort errorCount desc
| limit 10
```

**To save**:

1. Run the query
2. Click **Actions** → **Save query**
3. **Name**: Top Errors Last Hour
4. **Folder**: MedBookings/Production

#### Query 2: Slow Requests (>2 seconds)

```
fields @timestamp, message, context.path, context.durationMs, context.userId
| filter context.durationMs > 2000
| sort context.durationMs desc
| limit 20
```

**Save as**: Slow Requests

#### Query 3: User-Specific Errors

```
fields @timestamp, message, context.error.message, context.path
| filter level = "error" and context.userId like /USER_ID_HERE/
| sort @timestamp desc
```

**Save as**: User Errors

#### Query 4: Authentication Events Timeline

```
fields @timestamp, message, context.email, context.provider
| filter message like /sign-in|sign-out|Authentication error/
| sort @timestamp desc
```

**Save as**: Auth Events

#### Query 5: API Endpoint Performance

```
fields context.path, context.durationMs
| filter message = "tRPC request completed"
| stats avg(context.durationMs) as avgDuration, max(context.durationMs) as maxDuration, count() as requestCount by context.path
| sort avgDuration desc
```

**Save as**: API Performance

---

## Phase 6: Configure Environment Variables in Amplify

Add logging configuration to your Amplify environment variables.

1. Go to **Amplify Console** → Your App → **Environment variables**
2. Add the following for both production and staging:

**Production**:

```
LOG_LEVEL=info
NODE_ENV=production
```

**Staging**:

```
LOG_LEVEL=debug
NODE_ENV=staging
DEBUG_ALL=false
```

3. **Redeploy** your application to pick up the new environment variables

---

## Phase 7: Testing and Validation

### Step 1: Verify Logs Are Flowing

1. Go to **CloudWatch Console** → **Log groups**
2. Select your production log group
3. Click on the most recent **log stream** (sorted by "Last Event Time")
4. Verify you see structured JSON logs like:

```json
{
  "timestamp": "2025-10-25T12:00:00.000Z",
  "level": "info",
  "message": "tRPC request completed",
  "service": "medbookings",
  "environment": "production",
  "branch": "master",
  "context": {
    "path": "auth.session",
    "type": "query",
    "durationMs": 45,
    "success": true
  }
}
```

### Step 2: Test Error Logging

1. Trigger a test error in your application (e.g., try to access a protected route without auth)
2. Wait 2-3 minutes for logs to appear in CloudWatch
3. Go to **Logs Insights** and run the "Top Errors Last Hour" query
4. Verify your test error appears in the results

### Step 3: Test Alarms

1. Trigger multiple errors quickly (>10 errors in 5 minutes)
2. Wait for the alarm to trigger (~5 minutes)
3. Check your email for alarm notification
4. Go to **CloudWatch** → **Alarms** and verify alarm state changed to "In alarm"

### Step 4: Verify Dashboards

1. Open your dashboard: **CloudWatch** → **Dashboards** → **MedBookings-Production**
2. Verify all widgets are showing data
3. Refresh the dashboard to see real-time updates

---

## Troubleshooting

### Issue: Logs Not Appearing in CloudWatch

**Solution:**

1. Verify "Server-side logging" is enabled in Amplify settings
2. Check that application is logging using the enhanced logger (check code was deployed)
3. Wait 5-10 minutes - there can be a delay
4. Verify IAM role has CloudWatch Logs permissions (see below)

### Issue: Metric Filters Not Creating Metrics

**Solution:**

1. Test the filter pattern with a sample log entry
2. Ensure the JSON structure matches your log format
3. Verify logs are in JSON format in production (not human-readable)
4. Wait 5-10 minutes for metrics to populate

### Issue: Alarms Not Triggering

**Solution:**

1. Verify SNS subscription is confirmed (check email)
2. Test alarm by setting threshold very low (e.g., > 0)
3. Check metric has data points (CloudWatch → Metrics)
4. Verify alarm is configured correctly (period, statistic, threshold)

### Issue: IAM Permissions Error

**Required Policy** (attach to Amplify service role):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents",
        "logs:DescribeLogStreams"
      ],
      "Resource": "arn:aws:logs:*:*:log-group:/aws/amplify/*"
    }
  ]
}
```

---

## Cost Optimization Tips

1. **Reduce log retention** for staging (7 days vs. 30 days)
2. **Adjust LOG_LEVEL** to `warn` or `error` in production if logs are too verbose
3. **Filter out noisy logs** at application level (e.g., health checks)
4. **Use log sampling** for high-volume endpoints (implement in code)
5. **Archive old logs** to S3 for long-term storage (cheaper)

---

## Next Steps

1. **Monitor dashboards** daily for the first week to tune alarm thresholds
2. **Review top errors** weekly and fix root causes
3. **Set up custom metrics** for business KPIs (e.g., booking success rate)
4. **Consider APM tools** (e.g., New Relic, Datadog) for advanced monitoring if needed

---

## Additional Resources

- [AWS Amplify Monitoring Documentation](https://docs.aws.amazon.com/amplify/latest/userguide/access-logs.html)
- [CloudWatch Logs Insights Query Syntax](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/CWL_QuerySyntax.html)
- [CloudWatch Alarms Best Practices](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/Best_Practice_Recommended_Alarms_AWS_Services.html)

---

## Summary

After completing this guide, you will have:

✅ Server-side logs flowing from Amplify to CloudWatch
✅ Structured JSON logging with metadata (service, environment, branch)
✅ Metric filters extracting errors and authentication failures
✅ CloudWatch Alarms notifying you of issues via email
✅ Dashboards for visualizing application health
✅ Saved queries for quick debugging

**Your Next.js 500 errors will now be visible in CloudWatch with full stack traces!**

---

**Need Help?**

If you encounter issues not covered in this guide:

1. Check CloudWatch Logs for error messages
2. Verify all environment variables are set correctly
3. Ensure the latest code (with logging enhancements) is deployed
4. Review the Troubleshooting section above
