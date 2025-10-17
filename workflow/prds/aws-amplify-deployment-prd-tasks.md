# AWS Amplify Deployment - Task List

## Relevant Files

- `infrastructure/` - AWS CDK infrastructure code (to be created)
- `infrastructure/bin/medbookings-infra.ts` - CDK app entry point
- `infrastructure/lib/staging-stack.ts` - Staging environment stack
- `infrastructure/lib/production-stack.ts` - Production environment stack
- `infrastructure/cdk.json` - CDK configuration
- `.env.production` - Production environment variables for AWS deployment
- `.env.staging` - Staging environment variables for AWS deployment
- `next.config.js` - Next.js configuration with security headers and build optimizations
- `package.json` - Build scripts and dependencies (verify AWS SDK v3)
- `prisma/schema.prisma` - Database schema for RDS PostgreSQL
- `prisma/seed.mts` - Database seeding script with production-ready data
- `src/lib/storage/s3.ts` - New S3 storage utility (to be created, replacing Vercel Blob)
- `src/lib/storage/upload.ts` - File upload logic using S3 (to be updated)
- `docs/deployment/aws-cdk-setup.md` - CDK deployment guide (to be created)
- `docs/deployment/aws-amplify-setup.md` - Amplify setup guide (to be created)
- `docs/deployment/operational-playbook.md` - Operational procedures (to be created)
- `docs/deployment/database-migration.md` - Database migration guide (to be created)

### Notes

- End-to-end testing is handled via Playwright (`npx playwright test`)
- No unit testing framework is configured in this codebase
- Infrastructure provisioning will use AWS CDK (TypeScript-based IaC)
- AWS Amplify will be configured manually via console (not part of CDK stack)
- Database migrations will be run manually using Prisma CLI
- Sentry integration requires installing `@sentry/nextjs` package

### Staging Stack Outputs (Deployed)

- **RDS Endpoint**: `medbookingsinfrastack-staging-databaseb269d8bb-ynmq3xvpnv25.c9ccmo2uic7g.eu-west-1.rds.amazonaws.com:5432`
- **Database Name**: `medbookings`
- **Database Credentials ARN**: `arn:aws:secretsmanager:eu-west-1:455315867736:secret:medbookings-staging-db-credentials-rPlSQc`
- **S3 Bucket**: `medbookings-uploads-staging`
- **S3 Bucket ARN**: `arn:aws:s3:::medbookings-uploads-staging`
- **Amplify Service Role ARN**: `arn:aws:iam::455315867736:role/MedBookingsInfraStack-Sta-AmplifyServiceRole1EB3E93-4jVdrlpJp4qW`
- **SNS Alert Topic ARN**: `arn:aws:sns:eu-west-1:455315867736:medbookings-staging-critical-alerts`
- **Log Group**: `/medbookings/staging/application`

## Tasks

- [x] 1.0 Repository and Branch Setup

  - [x] 1.1 Create `staging` branch from `master` branch
  - [x] 1.2 Configure branch protection rules for `staging` branch (require PR reviews) - SKIPPED (requires GitHub Pro)
  - [x] 1.3 Configure branch protection rules for `master` branch (require PR reviews) - SKIPPED (requires GitHub Pro)
  - [x] 1.4 Update `.gitignore` to exclude CDK build artifacts (`infrastructure/cdk.out/`, `infrastructure/node_modules/`)
  - [x] 1.5 Push `staging` branch to GitHub remote

- [x] 2.0 AWS Account and IAM Configuration

  - [x] 2.1 Create or access AWS account for MedBookings deployment
  - [x] 2.2 Create IAM user `cdk-deploy-user` with AdministratorAccess (for initial setup)
  - [x] 2.3 Enable MFA (Multi-Factor Authentication) for IAM user
  - [x] 2.4 Generate AWS Access Key ID and Secret Access Key for CDK deployments
  - [x] 2.5 Configure AWS CLI locally with credentials (`aws configure`)
  - [x] 2.6 Verify AWS CLI is configured for eu-west-1 region
  - [x] 2.7 Create IAM service role for Amplify (managed by AWS - will be done during Amplify setup)

- [x] 3.0 AWS CDK Infrastructure as Code Setup

  - [x] 3.1 Install AWS CDK CLI globally: `npm install -g aws-cdk`
  - [x] 3.2 Verify CDK installation: `cdk --version`
  - [x] 3.3 Create `/infrastructure` directory in repository root
  - [x] 3.4 Initialize CDK project: `cd infrastructure && cdk init app --language typescript`
  - [x] 3.5 Install CDK construct libraries: `npm install @aws-cdk/aws-rds @aws-cdk/aws-s3 @aws-cdk/aws-ec2 @aws-cdk/aws-secretsmanager @aws-cdk/aws-cloudwatch @aws-cdk/aws-sns @aws-cdk/aws-iam`
  - [x] 3.6 Configure `cdk.json` with default region (eu-west-1) and context variables
  - [x] 3.7 Bootstrap CDK in AWS account: `cdk bootstrap aws://ACCOUNT-ID/eu-west-1`
  - [x] 3.8 Create `infrastructure/lib/staging-stack.ts` for staging environment
  - [x] 3.9 Create `infrastructure/lib/production-stack.ts` for production environment
  - [x] 3.10 Update `infrastructure/bin/medbookings-infra.ts` to instantiate both stacks

- [x] 4.0 Database Infrastructure (RDS PostgreSQL via CDK)

  - [x] 4.1 Define VPC construct in CDK stack (or use default VPC)
  - [x] 4.2 Create security group for RDS instance (allow PostgreSQL port 5432 from Amplify/Lambda)
  - [x] 4.3 Define RDS PostgreSQL instance for staging (db.t4g.micro, single-AZ, PostgreSQL 16.4)
  - [x] 4.4 Define RDS PostgreSQL instance for production (db.t4g.small, multi-AZ, PostgreSQL 16.4)
  - [x] 4.5 Configure automated backups (7-day retention, 2-4 AM SAST backup window)
  - [x] 4.6 Enable point-in-time recovery (PITR)
  - [x] 4.7 Enable storage encryption at rest
  - [x] 4.8 Enable SSL/TLS encryption in transit
  - [x] 4.9 Configure storage auto-scaling (20GB initial, 100GB max)
  - [x] 4.10 Create database credentials in Secrets Manager (via CDK)
  - [x] 4.11 Output RDS endpoint hostname as CDK stack output

- [ ] 5.0 S3 Storage Infrastructure (via CDK) and Code Migration

  - [x] 5.1 Define S3 bucket for staging: `medbookings-uploads-staging`
  - [x] 5.2 Define S3 bucket for production: `medbookings-uploads-production`
  - [x] 5.3 Configure bucket encryption (AES-256 server-side encryption)
  - [x] 5.4 Configure CORS policy for client-side uploads
  - [x] 5.5 Configure lifecycle policy for old file cleanup (optional, e.g., delete after 90 days)
  - [x] 5.6 Create IAM policy for S3 bucket access (read/write permissions)
  - [x] 5.7 Create IAM role for Amplify/Lambda to access S3 buckets
  - [x] 5.8 Output S3 bucket names as CDK stack outputs
  - [ ] 5.9 Install AWS SDK v3 in main application: `npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner`
  - [ ] 5.10 Create `src/lib/storage/s3.ts` utility for S3 operations (upload, download, delete, generate presigned URLs)
  - [ ] 5.11 Update file upload logic in `src/lib/storage/upload.ts` to use S3 instead of Vercel Blob
  - [ ] 5.12 Search codebase for Vercel Blob usage and replace with S3 calls
  - [ ] 5.13 Remove `BLOB_READ_WRITE_TOKEN` from environment variables

- [x] 6.0 AWS Secrets Manager and Security Configuration (via CDK)

  - [x] 6.1 Create Secrets Manager secret for staging RDS database credentials
  - [x] 6.2 Create Secrets Manager secret for production RDS database credentials
  - [x] 6.3 Store database credentials: username, password, database name, host, port
  - [x] 6.4 Enable automatic secret rotation for database passwords (30-day rotation)
  - [x] 6.5 Create IAM policy for Amplify/Lambda to read Secrets Manager secrets
  - [x] 6.6 Define security groups for RDS (allow inbound on port 5432 only from Amplify VPC)
  - [x] 6.7 Output Secrets Manager ARNs as CDK stack outputs

- [x] 7.0 CloudWatch Monitoring and SNS Alerts (via CDK)

  - [x] 7.1 Create CloudWatch Log Group for application logs (30-day retention)
  - [x] 7.2 Create SNS topic for critical alerts: `medbookings-critical-alerts`
  - [x] 7.3 Subscribe email `aws-root@medbookings.co.za` to SNS topic
  - [ ] 7.4 Confirm SNS email subscription (check email and confirm)
  - [x] 7.5 Create CloudWatch alarm for RDS CPU utilization (>80% for 5 minutes)
  - [x] 7.6 Create CloudWatch alarm for RDS storage space (>80% full)
  - [x] 7.7 Create CloudWatch alarm for RDS connection errors
  - [x] 7.8 Create CloudWatch alarm for high latency (p95 > 2 seconds) - configure after Amplify deployment
  - [x] 7.9 Create CloudWatch alarm for high error rate (>5% errors in 5 minutes) - configure after Amplify deployment
  - [x] 7.10 Output SNS topic ARN as CDK stack output

- [ ] 8.0 Deploy CDK Stacks (Staging and Production)

  - [x] 8.1 Review CDK synthesized CloudFormation template: `cdk synth MedBookingsInfraStack-Staging`
  - [x] 8.2 Deploy staging infrastructure stack: `cdk deploy MedBookingsInfraStack-Staging`
  - [ ] 8.3 Verify staging resources in AWS Console (RDS, S3, Secrets Manager, SNS, CloudWatch)
  - [x] 8.4 Capture CDK stack outputs (RDS endpoint, S3 bucket names, Secrets Manager ARNs)
  - [ ] 8.5 Review CDK synthesized CloudFormation template: `cdk synth MedBookingsInfraStack-Production`
  - [ ] 8.6 Deploy production infrastructure stack: `cdk deploy MedBookingsInfraStack-Production`
  - [ ] 8.7 Verify production resources in AWS Console (RDS, S3, Secrets Manager, SNS, CloudWatch)
  - [ ] 8.8 Capture CDK stack outputs for production environment
  - [ ] 8.9 Document CDK deployment process in `docs/deployment/aws-cdk-setup.md`

- [ ] 9.0 AWS Amplify Hosting Setup (Manual Console Configuration)

  - [ ] 9.1 Navigate to AWS Amplify Console in eu-west-1 region
  - [ ] 9.2 Create new Amplify app for staging environment
  - [ ] 9.3 Connect staging app to GitHub repository `https://github.com/sheigoldberg/medbookings`
  - [ ] 9.4 Configure staging app to deploy from `staging` branch
  - [ ] 9.5 Configure build settings: Node.js 20.x, build command `npm run build`, output directory `.next`
  - [ ] 9.6 Add custom build spec if needed (include `npx prisma generate`)
  - [ ] 9.7 Enable automatic deployments for staging (deploy on every push to `staging` branch)
  - [ ] 9.8 Create new Amplify app for production environment
  - [ ] 9.9 Connect production app to GitHub repository
  - [ ] 9.10 Configure production app to deploy from `master` branch
  - [ ] 9.11 Configure build settings for production (same as staging)
  - [ ] 9.12 Enable automatic deployments for production (deploy on every push to `master` branch)
  - [ ] 9.13 Configure CloudFront CDN settings (enable caching, HTTPS only)
  - [ ] 9.14 Note Amplify app IDs and default URLs for both environments

- [ ] 10.0 Domain, DNS, and SSL Configuration

  - [ ] 10.1 Navigate to AWS Certificate Manager (ACM) in eu-west-1
  - [ ] 10.2 Request SSL certificate for production: `medbookings.co.za` and `www.medbookings.co.za`
  - [ ] 10.3 Request SSL certificate for staging: `staging.medbookings.co.za`
  - [ ] 10.4 Choose DNS validation method for certificate verification
  - [ ] 10.5 Add CNAME records to DNS provider for certificate validation
  - [ ] 10.6 Wait for certificate validation to complete (can take 30 minutes)
  - [ ] 10.7 In Amplify Console, add custom domain for production: `medbookings.co.za` and `www.medbookings.co.za`
  - [ ] 10.8 In Amplify Console, add custom domain for staging: `staging.medbookings.co.za`
  - [ ] 10.9 Amplify will provide CNAME records for domain configuration
  - [ ] 10.10 Add CNAME records to DNS provider pointing to Amplify app URLs
  - [ ] 10.11 Wait for DNS propagation and SSL activation
  - [ ] 10.12 Verify HTTPS redirect works (HTTP → HTTPS)
  - [ ] 10.13 Verify `www` redirect works (<www.medbookings.co.za> → medbookings.co.za)

- [ ] 11.0 Environment Variables Configuration in Amplify

  - [ ] 11.1 Retrieve RDS endpoints from CDK stack outputs
  - [ ] 11.2 Retrieve S3 bucket names from CDK stack outputs
  - [ ] 11.3 Retrieve Secrets Manager ARNs from CDK stack outputs
  - [ ] 11.4 In Amplify Console (staging), add environment variable `NODE_ENV=production`
  - [ ] 11.5 Add `NEXTAUTH_URL=https://staging.medbookings.co.za`
  - [ ] 11.6 Generate new `AUTH_SECRET` for staging: `openssl rand -base64 32`
  - [ ] 11.7 Add database environment variables (DATABASE_URL, DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME) from Secrets Manager
  - [ ] 11.8 Add S3 environment variables: `AWS_S3_BUCKET_NAME`, `AWS_REGION=eu-west-1`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`
  - [ ] 11.9 Add existing third-party API keys (Google OAuth, Google Maps, Twilio, SendGrid, Firecrawl)
  - [ ] 11.10 Add `ADMIN_EMAILS` and `ADMIN_NOTIFICATION_EMAIL`
  - [ ] 11.11 Repeat steps 11.4-11.10 for production environment in Amplify Console
  - [ ] 11.12 Update `NEXTAUTH_URL=https://medbookings.co.za` for production
  - [ ] 11.13 Generate separate `AUTH_SECRET` for production
  - [ ] 11.14 Use production RDS endpoint and S3 bucket for production environment variables

- [ ] 12.0 Sentry Error Tracking Integration

  - [ ] 12.1 Create Sentry account at <https://sentry.io> (if not exists)
  - [ ] 12.2 Create new Sentry organization for MedBookings
  - [ ] 12.3 Create new Sentry project for Next.js application
  - [ ] 12.4 Capture Sentry DSN (Data Source Name) from project settings
  - [ ] 12.5 Install Sentry Next.js SDK: `npm install @sentry/nextjs`
  - [ ] 12.6 Run Sentry wizard: `npx @sentry/wizard -i nextjs`
  - [ ] 12.7 Configure `sentry.client.config.ts` for client-side error tracking
  - [ ] 12.8 Configure `sentry.server.config.ts` for server-side (SSR) error tracking
  - [ ] 12.9 Configure `sentry.edge.config.ts` for edge runtime error tracking
  - [ ] 12.10 Add `SENTRY_DSN` to Amplify environment variables (both staging and production)
  - [ ] 12.11 Add `SENTRY_AUTH_TOKEN` for source map uploads
  - [ ] 12.12 Configure Sentry release tracking and source map uploads in build process
  - [ ] 12.13 Test Sentry integration by triggering a test error
  - [ ] 12.14 Configure Sentry alerts and integrations (email notifications)

- [ ] 13.0 Database Migration and Seeding

  - [ ] 13.1 Update local `.env` with staging RDS connection string for testing migration commands
  - [ ] 13.2 Run Prisma migration check: `npx prisma migrate status`
  - [ ] 13.3 Run Prisma migration deploy on staging: `npx prisma migrate deploy`
  - [ ] 13.4 Verify all tables created in staging RDS database using Prisma Studio or SQL client
  - [ ] 13.5 Run database seed on staging: `npx prisma db seed`
  - [ ] 13.6 Verify seed data populated correctly (check provider types, services, requirements)
  - [ ] 13.7 Create read-only database user `medbookings_readonly` with SELECT permissions
  - [ ] 13.8 Test read-only user can query data but cannot modify
  - [ ] 13.9 Update local `.env` with production RDS connection string
  - [ ] 13.10 Run Prisma migration deploy on production: `npx prisma migrate deploy`
  - [ ] 13.11 Verify all tables created in production RDS database
  - [ ] 13.12 Run database seed on production: `npx prisma db seed`
  - [ ] 13.13 Verify production seed data populated correctly
  - [ ] 13.14 Create read-only database user for production environment
  - [ ] 13.15 Document migration commands in `docs/deployment/database-migration.md`

- [ ] 14.0 Third-Party Service Configuration

  - [ ] 14.1 Navigate to Google Cloud Console OAuth credentials
  - [ ] 14.2 Add staging callback URL: `https://staging.medbookings.co.za/api/auth/callback/google`
  - [ ] 14.3 Add production callback URL: `https://medbookings.co.za/api/auth/callback/google`
  - [ ] 14.4 Test Google OAuth login on staging environment
  - [ ] 14.5 Navigate to SendGrid dashboard
  - [ ] 14.6 Verify domain `medbookings.co.za` or add for authentication
  - [ ] 14.7 Add SPF DNS record: `v=spf1 include:sendgrid.net ~all`
  - [ ] 14.8 Add DKIM DNS records (provided by SendGrid for domain `medbookings.co.za`)
  - [ ] 14.9 Add DMARC DNS record: `v=DMARC1; p=none; rua=mailto:aws-root@medbookings.co.za`
  - [ ] 14.10 Verify domain authentication in SendGrid (status should be "Verified")
  - [ ] 14.11 Send test email from staging environment to verify SendGrid integration
  - [ ] 14.12 Verify Google Maps API key works on staging (check map components load)
  - [ ] 14.13 Verify Twilio SMS/WhatsApp integration works on staging (send test message)

- [ ] 15.0 Application Code Updates (S3 Migration, Security Headers)

  - [ ] 15.1 Update `next.config.js` to add security headers (CSP, X-Frame-Options, X-Content-Type-Options, Strict-Transport-Security)
  - [ ] 15.2 Configure Next.js to work with CloudFront CDN (handle X-Forwarded-\* headers)
  - [ ] 15.3 Test S3 file upload functionality locally (use staging S3 bucket)
  - [ ] 15.4 Test S3 file download functionality locally
  - [ ] 15.5 Test S3 file deletion functionality locally
  - [ ] 15.6 Update any hardcoded URLs to use environment variables
  - [ ] 15.7 Commit and push S3 migration changes to `staging` branch
  - [ ] 15.8 Verify Amplify staging deployment succeeds
  - [ ] 15.9 Test file uploads on staging environment
  - [ ] 15.10 Merge `staging` branch to `master` after validation
  - [ ] 15.11 Verify Amplify production deployment succeeds

- [ ] 16.0 Testing and Validation

  - [ ] 16.1 Test staging environment: Application loads at `https://staging.medbookings.co.za` (HTTP 200)
  - [ ] 16.2 Test staging: Database connection successful (queries work)
  - [ ] 16.3 Test staging: Google OAuth login flow completes successfully
  - [ ] 16.4 Test staging: File upload to S3 works
  - [ ] 16.5 Test staging: Email sending works (SendGrid)
  - [ ] 16.6 Test staging: SMS sending works (Twilio)
  - [ ] 16.7 Test staging: Google Maps components load correctly
  - [ ] 16.8 Test staging: Sentry receives error events (trigger test error)
  - [ ] 16.9 Test staging: Check CloudWatch logs for application activity
  - [ ] 16.10 Test production: Application loads at `https://medbookings.co.za` (HTTP 200)
  - [ ] 16.11 Test production: SSL certificate active (browser shows secure lock)
  - [ ] 16.12 Test production: Database connection successful
  - [ ] 16.13 Test production: Google OAuth login flow works
  - [ ] 16.14 Test production: All critical user flows (booking, provider registration, etc.)
  - [ ] 16.15 Performance testing: Verify page load time < 3 seconds
  - [ ] 16.16 Performance testing: Verify Time to First Byte (TTFB) < 500ms
  - [ ] 16.17 Test automatic deployment: Push change to `staging` branch, verify auto-deploy
  - [ ] 16.18 Test automatic deployment: Push change to `master` branch, verify auto-deploy
  - [ ] 16.19 Run Playwright E2E tests against staging environment (optional, not blocking)
  - [ ] 16.20 Verify CloudWatch alarms are active and configured correctly

- [ ] 17.0 Documentation and Handoff
  - [ ] 17.1 Create `docs/deployment/aws-cdk-setup.md` with CDK installation and deployment instructions
  - [ ] 17.2 Document CDK stack structure and how to modify infrastructure
  - [ ] 17.3 Create `docs/deployment/aws-amplify-setup.md` with Amplify console setup steps
  - [ ] 17.4 Document environment variable configuration for both environments
  - [ ] 17.5 Create `docs/deployment/database-migration.md` with Prisma migration commands
  - [ ] 17.6 Document database seeding process and seed file location
  - [ ] 17.7 Create `docs/deployment/operational-playbook.md` with operational procedures
  - [ ] 17.8 Document how to deploy CDK infrastructure changes (`cdk deploy`)
  - [ ] 17.9 Document how to roll back Amplify application deployments
  - [ ] 17.10 Document how to access CloudWatch logs and metrics
  - [ ] 17.11 Document how to respond to CloudWatch alarms
  - [ ] 17.12 Document how to scale RDS instance (modify CDK stack and redeploy)
  - [ ] 17.13 Document how to rotate database credentials in Secrets Manager
  - [ ] 17.14 Create inventory of all AWS resources (RDS endpoints, S3 buckets, IAM roles, Secrets Manager secrets)
  - [ ] 17.15 Document estimated monthly costs for staging and production
  - [ ] 17.16 Create troubleshooting guide for common deployment issues
  - [ ] 17.17 Document disaster recovery procedures (database restoration, infrastructure rebuild)
  - [ ] 17.18 Share documentation with team and get sign-off on deployment
