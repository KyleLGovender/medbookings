# ⚠️ DEPRECATED - NOT IMPLEMENTED

**Status**: This PRD is archived and NOT implemented.
**Reason**: Project was deployed to **Vercel**, not AWS Amplify.
**Date Archived**: 2025-11-02
**Git Commits**:
- c7f7803: "chore: remove AWS Amplify and S3 code for clean Vercel deployment"
- 1144b0b: "feat: add Vercel Blob storage support for AWS to Vercel migration"

**Current Deployment**: See `/docs/deployment/VERCEL-DEPLOYMENT.md` for actual deployment documentation.

---

# AWS Amplify Deployment - EU West 1 (Ireland)

## Introduction/Overview

Deploy the MedBookings Next.js application to AWS Amplify hosting in the EU West 1 (Ireland) region with full production infrastructure including PostgreSQL RDS database, CloudFront CDN, SSL certificates, CI/CD pipeline, and comprehensive monitoring.

This deployment will establish both **staging** and **production** environments with automatic deployments from GitHub, replacing the current Vercel hosting setup with a scalable AWS infrastructure.

### Problem Statement

The MedBookings application is currently on Vercel but not live. We need a production-ready AWS deployment that provides:

- Full control over infrastructure
- EU-based hosting for data residency compliance
- Scalable database solution with backups
- Multi-environment support (staging + production)
- Comprehensive monitoring and error tracking

## Goals

1. **Deploy production-ready infrastructure** in AWS EU West 1 (Ireland) region
2. **Establish two environments**: Staging and Production with isolated resources
3. **Migrate from local Docker PostgreSQL** to AWS RDS PostgreSQL with automated backups
4. **Implement CI/CD pipeline** for automatic deployments from GitHub master branch
5. **Configure custom domain** (medbookings.co.za) with SSL certificates
6. **Set up monitoring and alerting** using CloudWatch and Sentry
7. **Ensure zero-downtime deployments** with health checks and validation
8. **Establish security best practices** for production workloads

## User Stories

### As a DevOps Engineer

- I want automatic deployments triggered on every push to master, so that changes go live without manual intervention
- I want separate staging and production environments, so that I can test changes before they affect production users
- I want automated database backups and point-in-time recovery, so that data is protected against failures
- I want monitoring dashboards and alerts, so that I can quickly identify and resolve issues

### As a Developer

- I want Prisma migrations to be manageable and trackable, so that schema changes are controlled
- I want environment variables managed securely, so that credentials are not exposed
- I want clear deployment logs, so that I can debug build or runtime issues
- I want Sentry integrated, so that I can track and fix frontend and backend errors

### As a Product Owner

- I want the application to be fast and reliable, so that users have a good experience
- I want the infrastructure to scale automatically, so that we can handle traffic growth
- I want costs to be optimized, so that we don't overspend on infrastructure
- I want the domain medbookings.co.za to work with SSL, so that users trust the platform

## Functional Requirements

### 0. Infrastructure as Code Setup (AWS CDK)

**FR-0.1**: Initialize AWS CDK project in repository

- Install AWS CDK CLI globally: `npm install -g aws-cdk`
- Initialize CDK project in `/infrastructure` directory
- Use TypeScript for CDK constructs (consistent with codebase)
- Configure CDK for EU West 1 (Ireland) region

**FR-0.2**: Define infrastructure stacks

- Create separate stacks for staging and production environments
- Stack naming: `MedBookingsInfraStack-Staging` and `MedBookingsInfraStack-Production`
- Use CDK context variables for environment-specific configuration

**FR-0.3**: CDK constructs to include

- RDS PostgreSQL database instances
- S3 buckets for file storage
- Security groups and VPC configuration
- IAM roles for service-to-service access
- AWS Secrets Manager secrets
- CloudWatch log groups and alarms
- SNS topics for notifications

**FR-0.4**: CDK deployment workflow

- Bootstrap CDK in AWS account: `cdk bootstrap`
- Deploy staging stack first: `cdk deploy MedBookingsInfraStack-Staging`
- Deploy production stack after validation: `cdk deploy MedBookingsInfraStack-Production`
- Output critical values (RDS endpoints, S3 bucket names) for Amplify configuration

**FR-0.5**: Infrastructure versioning

- Version control all CDK code in main repository
- Document infrastructure changes in pull requests
- Tag infrastructure releases aligned with application releases

### 1. AWS Amplify Hosting Setup

**FR-1.1**: Deploy Next.js 14 application to AWS Amplify in EU West 1 (Ireland) region

- Use Node.js 20.x runtime
- Build command: `npm run build` (includes `npx prisma generate && next build`)
- Output directory: `.next`
- Support for Next.js App Router and Server-Side Rendering

**FR-1.2**: Create two separate Amplify apps:

- **Production**: Connected to `master` branch
- **Staging**: Connected to `develop` or `staging` branch (to be created if needed)

**FR-1.3**: Enable automatic deployments on every push to configured branches

- No manual approval required
- Automatic rollback on deployment failure

**FR-1.4**: Configure CloudFront CDN for global content delivery

- Edge caching for static assets
- HTTPS only enforcement

### 2. Database Infrastructure

**FR-2.1**: Provision AWS RDS PostgreSQL instance in EU West 1

- **Staging**: db.t4g.micro (1 vCPU, 1GB RAM)
- **Production**: db.t4g.small (2 vCPU, 2GB RAM)
- PostgreSQL version: 16.4 (matching current Docker setup)
- Multi-AZ deployment for production
- Single-AZ for staging (cost optimization)

**FR-2.2**: Enable automated backups

- Backup retention period: 7 days minimum
- Backup window: During low-traffic hours
- Enable point-in-time recovery (PITR)

**FR-2.3**: Configure database security

- Database accessible only from Amplify/Lambda functions (security groups)
- SSL/TLS encryption in transit
- Encryption at rest enabled
- Strong master password stored in AWS Secrets Manager

**FR-2.4**: Database migration strategy

- Create fresh database from Prisma schema
- Run Prisma migrations manually initially (not automatic on deployment)
- Execute database seeding using existing seed file (`tsx prisma/seed.mts`)
- Document migration commands for future schema updates

### 3. Domain and SSL Configuration

**FR-3.1**: Configure custom domain `medbookings.co.za`

- Production: `medbookings.co.za` and `www.medbookings.co.za`
- Staging: `staging.medbookings.co.za`

**FR-3.2**: Provision and auto-renew SSL certificates via AWS Certificate Manager

- HTTPS enforcement (redirect HTTP to HTTPS)
- TLS 1.2+ only

**FR-3.3**: Configure DNS records in Route 53 or existing DNS provider

- Provide step-by-step DNS configuration instructions

### 4. Environment Variables and Secrets

**FR-4.1**: Configure all required environment variables in Amplify Console:

**Common Variables (both environments):**

- `NODE_ENV`: `production`
- `NEXTAUTH_URL`: Environment-specific URL
- `AUTH_SECRET`: Unique per environment
- `GOOGLE_CLIENT_ID`: Google OAuth credentials
- `GOOGLE_CLIENT_SECRET`: Google OAuth credentials
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`: Client-side Maps API
- `BLOB_READ_WRITE_TOKEN`: Vercel Blob storage token
- `TWILIO_ACCOUNT_SID`: Twilio SMS credentials
- `TWILIO_AUTH_TOKEN`: Twilio auth token
- `TWILIO_PHONE_NUMBER`: Twilio phone number
- `TWILIO_WHATSAPP_NUMBER`: WhatsApp number
- `SENDGRID_API_KEY`: SendGrid email API
- `SENDGRID_FROM_EMAIL`: Email sender address
- `FIRECRAWL_API_KEY`: Firecrawl API key
- `ADMIN_EMAILS`: Admin user emails
- `ADMIN_NOTIFICATION_EMAIL`: Notification recipient

**Database Variables (generated from RDS):**

- `DATABASE_URL`: PostgreSQL connection string with RDS endpoint
- `DB_HOST`: RDS endpoint hostname
- `DB_PORT`: `5432`
- `DB_USER`: Database username
- `DB_PASSWORD`: Database password (from Secrets Manager)
- `DB_NAME`: Database name

**FR-4.2**: Store sensitive credentials in AWS Secrets Manager

- Reference secrets in Amplify environment variables
- Automatic secret rotation for database passwords

**FR-4.3**: Document process for updating environment variables

- Different values for staging vs. production where needed
- Process for adding new variables in future

### 5. CI/CD Pipeline

**FR-5.1**: Connect GitHub repository `https://github.com/sheigoldberg/medbookings`

- Automatic builds triggered on push to `master` branch
- Build logs accessible in Amplify Console

**FR-5.2**: Build process must include:

- Dependency installation: `npm install`
- Prisma client generation: `npx prisma generate`
- Next.js build: `next build`
- Environment variable injection

**FR-5.3**: Post-deployment validation (health checks)

- Application responds with HTTP 200
- Database connection successful
- Critical API routes functional

**FR-5.4**: Deployment notifications

- Send notifications via SNS (email to `aws-root@medbookings.co.za`)
- Notify on: Build start, build success, build failure, deployment success, deployment failure

### 6. Monitoring and Observability

**FR-6.1**: AWS CloudWatch setup

- Enable application logs from Lambda functions
- Infrastructure metrics (CPU, memory, disk, network)
- Custom metrics for API response times
- Log retention: 30 days

**FR-6.2**: CloudWatch Alarms

- Deployment failure alerts
- High error rate alerts (>5% error rate in 5 minutes)
- High latency alerts (p95 > 2 seconds)
- Database connection errors
- RDS storage space warnings (>80% full)

**FR-6.3**: Sentry Integration for Error Tracking

- Create new Sentry organization/project for MedBookings
- Configure Sentry DSN in environment variables
- Track both frontend (client-side) and backend (SSR) errors
- Enable source maps upload for readable stack traces
- Configure error alerts and integrations

**FR-6.4**: SNS Notification Topics

- Create SNS topic for critical alerts
- Subscribe `aws-root@medbookings.co.za` to alert notifications
- Optional: Integrate with Slack for real-time alerts

### 7. Security Configuration

**FR-7.1**: IAM Access Control

- Grant AWS Console access to `aws-root@medbookings.co.za`
- Use IAM roles for service-to-service communication (Amplify → RDS)
- Follow principle of least privilege

**FR-7.2**: Network Security

- RDS in private subnet (not publicly accessible)
- Security groups allowing only Amplify/Lambda access to database
- No SSH access to database servers

**FR-7.3**: Application Security Headers

- Configure Next.js security headers in `next.config.js`
- Content Security Policy (CSP)
- X-Frame-Options
- X-Content-Type-Options
- Strict-Transport-Security

**FR-7.4**: Secrets Management

- All sensitive credentials in AWS Secrets Manager
- No hardcoded secrets in code or environment variables
- Automatic secret rotation enabled for database passwords

### 8. Scaling and Performance

**FR-8.1**: Auto-scaling Configuration

- Amplify: Automatic scaling based on traffic (built-in)
- RDS: Enable storage auto-scaling (start with 20GB, max 100GB)
- CloudFront: Global edge caching enabled

**FR-8.2**: Performance Optimization

- Enable Next.js build optimizations (minification, tree-shaking)
- Configure CloudFront cache policies for static assets
- Database connection pooling via Prisma

**FR-8.3**: Cost Optimization

- Use t4g instances (ARM-based, cost-effective)
- Staging environment sized smaller than production
- Enable RDS auto-pause for staging during off-hours (if supported)

### 9. Backup and Disaster Recovery

**FR-9.1**: Database Backup Strategy

- Automated daily backups to S3
- 7-day backup retention minimum
- Point-in-time recovery (PITR) enabled
- Manual snapshot before each deployment

**FR-9.2**: Infrastructure as Code (AWS CDK)

- Define all infrastructure using AWS CDK (TypeScript)
- Separate CDK stacks for staging and production environments
- Version control all infrastructure code in repository
- Include: RDS instances, S3 buckets, security groups, IAM roles, Secrets Manager secrets
- Automated deployment of infrastructure changes via CDK CLI
- Infrastructure code located in `/infrastructure` directory

**FR-9.3**: Disaster Recovery Procedures

- Document database restoration process
- Document application rollback process
- Define Recovery Time Objective (RTO): 1 hour
- Define Recovery Point Objective (RPO): 5 minutes

### 10. Documentation and Handoff

**FR-10.1**: Create deployment runbook with:

- AWS CDK setup and installation instructions
- CDK stack deployment commands (`cdk deploy`)
- AWS Amplify setup instructions (manual via console)
- DNS configuration steps
- Environment variable configuration in Amplify Console
- Prisma migration execution commands
- Database seeding instructions
- Troubleshooting common issues

**FR-10.2**: Create operational playbook with:

- How to deploy infrastructure changes via CDK (`cdk deploy`)
- How to update CDK stack parameters
- How to deploy application changes (automatic via Amplify)
- How to roll back a deployment
- How to run database migrations
- How to access logs and metrics
- How to respond to alerts
- How to scale resources up/down (modify CDK stack)

**FR-10.3**: Access credentials documentation

- List of all AWS resources created
- IAM users and roles
- Secrets Manager secret names
- Database connection details
- Monitoring dashboard URLs

## Non-Goals (Out of Scope)

1. **Migration of existing production data** - This is a fresh deployment, not a migration
2. **Multi-region deployment** - Only EU West 1 (Ireland) for now
3. **Kubernetes or ECS deployment** - Using AWS Amplify managed hosting only
4. **Custom VPC setup** - Using default VPC with proper security groups
5. **Advanced WAF rules** - Basic security only; advanced WAF can be added later
6. **IP-based access restrictions** - Application publicly accessible
7. **Blue-green deployment strategy** - Using Amplify's built-in deployment mechanism
8. **Automated Playwright E2E tests** - Tests will not run as part of CI/CD pipeline
9. **Custom build containers** - Using Amplify's default build images
10. **Database read replicas** - Single RDS instance per environment (can be added later for scaling)

## Design Considerations

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                          Route 53                            │
│                  (DNS: medbookings.co.za)                    │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                      CloudFront CDN                          │
│                    (Global Edge Caching)                     │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                      AWS Amplify                             │
│                  (Next.js 14 Hosting)                        │
│                                                              │
│  ┌─────────────────┐              ┌─────────────────┐       │
│  │   Production    │              │     Staging     │       │
│  │  (master branch)│              │ (staging branch)│       │
│  └────────┬────────┘              └────────┬────────┘       │
│           │                                │                │
│           ▼                                ▼                │
│  ┌─────────────────┐              ┌─────────────────┐       │
│  │  Lambda@Edge    │              │  Lambda@Edge    │       │
│  │  (SSR Runtime)  │              │  (SSR Runtime)  │       │
│  └────────┬────────┘              └────────┬────────┘       │
└───────────┼─────────────────────────────────┼───────────────┘
            │                                 │
            ▼                                 ▼
┌─────────────────────────────────────────────────────────────┐
│                    Private Subnet (VPC)                      │
│                                                              │
│  ┌──────────────────┐              ┌──────────────────┐     │
│  │  RDS PostgreSQL  │              │  RDS PostgreSQL  │     │
│  │   (Production)   │              │    (Staging)     │     │
│  │  db.t4g.small    │              │  db.t4g.micro    │     │
│  │    Multi-AZ      │              │    Single-AZ     │     │
│  └────────┬─────────┘              └────────┬─────────┘     │
│           │                                 │               │
│           ▼                                 ▼               │
│  ┌──────────────────────────────────────────────────┐       │
│  │        Automated Backups → S3                    │       │
│  └──────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────┘
            │                                 │
            ▼                                 ▼
┌─────────────────────────────────────────────────────────────┐
│                  AWS Secrets Manager                         │
│         (Database credentials, API keys)                     │
└─────────────────────────────────────────────────────────────┘
            │                                 │
            ▼                                 ▼
┌─────────────────────────────────────────────────────────────┐
│                      Monitoring Stack                        │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │  CloudWatch  │  │    Sentry    │  │  SNS Alerts  │       │
│  │   Metrics    │  │ Error Track  │  │   (Email)    │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────┐
│                      GitHub Repo                             │
│         https://github.com/sheigoldberg/medbookings         │
│                  (CI/CD Integration)                         │
└─────────────────────────────────────────────────────────────┘
```

### UI/UX Considerations

- No changes to application UI/UX
- Users should experience faster load times due to CloudFront CDN
- SSL certificate ensures browser shows secure lock icon
- Zero downtime during deployments

### Technology Stack

- **Hosting**: AWS Amplify (Next.js 14 optimized)
- **Database**: AWS RDS PostgreSQL 16.4
- **CDN**: AWS CloudFront
- **DNS**: AWS Route 53 or existing DNS provider
- **Monitoring**: AWS CloudWatch + Sentry
- **Secrets**: AWS Secrets Manager
- **CI/CD**: GitHub → AWS Amplify
- **Runtime**: Node.js 20.x

## Technical Considerations

### 1. Prisma and Database Migrations

- **Challenge**: Prisma migrations must be run manually (not automatic on deploy)
- **Solution**: Document clear migration commands and process
- **Commands**:

  ```bash
  # Connect to RDS database via DATABASE_URL
  npx prisma migrate deploy  # Apply pending migrations
  npx prisma db seed         # Seed initial data
  ```

### 2. Next.js Build Configuration

- The build command includes Prisma generation: `npx prisma generate && next build`
- Ensure DATABASE_URL is available during build time (Amplify environment variables)
- Next.js 14 App Router requires SSR support (Amplify provides this via Lambda)

### 3. Google OAuth Callback URLs

- Update Google Cloud Console with new callback URLs:
  - Production: `https://medbookings.co.za/api/auth/callback/google`
  - Staging: `https://staging.medbookings.co.za/api/auth/callback/google`

### 4. Database Connection Pooling

- Prisma uses connection pooling by default
- Configure connection limit in DATABASE_URL:

  ```
  postgresql://user:password@host:5432/db?connection_limit=10
  ```

- For serverless environments, consider using Prisma Data Proxy or PgBouncer for production

### 5. Environment Variable Management

- Use AWS Systems Manager Parameter Store or Secrets Manager for sensitive values
- Reference in Amplify: `@aws-secrets-manager/secret-name`
- Staging and production have separate secret stores

### 6. Static Asset Handling

- Next.js static assets automatically deployed to CloudFront
- Public folder files served from CDN
- Image optimization via Next.js Image component

### 7. Logging and Debugging

- Server-side logs available in CloudWatch Logs
- Client-side errors tracked in Sentry
- tRPC errors logged to both CloudWatch and Sentry

### 8. Database Security

- RDS must be in private subnet (no public IP)
- Security group allows inbound PostgreSQL (5432) only from Amplify VPC
- Use SSL connection string: `?sslmode=require`

### 9. Cost Estimation (Monthly)

**Staging Environment:**

- Amplify hosting: ~$5-10 (low traffic)
- RDS db.t4g.micro: ~$15
- Data transfer: ~$5
- **Total Staging**: ~$25-30/month

**Production Environment:**

- Amplify hosting: ~$20-50 (depends on traffic)
- RDS db.t4g.small (Multi-AZ): ~$60
- CloudFront: ~$10-20
- Data transfer: ~$10-20
- CloudWatch: ~$5
- Secrets Manager: ~$2
- **Total Production**: ~$107-157/month

**Total Estimated Cost**: ~$132-187/month

### 10. Scaling Considerations

- **Traffic growth**: Amplify auto-scales, no action needed
- **Database growth**: Enable storage auto-scaling (20GB → 100GB)
- **Connection limits**: Monitor database connections; upgrade instance size if needed
- **Future optimization**: Add read replicas, implement caching (Redis/ElastiCache)

## Success Metrics

### Deployment Success Criteria

1. ✅ Application loads at `https://medbookings.co.za` without errors (HTTP 200)
2. ✅ Database connection successful (queries work)
3. ✅ Google OAuth login flow completes successfully
4. ✅ All environment variables correctly configured and accessible
5. ✅ SSL certificate active and browser shows secure connection
6. ✅ CloudFront CDN serving static assets
7. ✅ CloudWatch logs showing application activity
8. ✅ Sentry receiving error events (test error tracking)
9. ✅ Automatic deployment triggered by push to master branch
10. ✅ Health check endpoint returning 200 OK

### Performance Metrics

- **Page Load Time**: < 3 seconds (median)
- **Time to First Byte (TTFB)**: < 500ms
- **Database Query Time**: < 100ms (p95)
- **Build Time**: < 5 minutes
- **Deployment Time**: < 3 minutes

### Operational Metrics

- **Uptime**: 99.9% availability target
- **Error Rate**: < 1% of requests
- **Failed Deployments**: < 5% of total deployments
- **Recovery Time**: < 1 hour for critical issues

### Business Metrics

- **Infrastructure Cost**: Stay within $200/month budget initially
- **Deployment Frequency**: Support multiple deployments per day
- **Mean Time to Recovery (MTTR)**: < 1 hour

## Decisions Made

### ✅ Confirmed Requirements

1. **Staging Branch**: Create new `staging` branch in GitHub for staging environment deployments

   - Workflow: Feature branches → `staging` branch → `master` branch
   - Staging environment deploys from `staging` branch
   - Production environment deploys from `master` branch

2. **Database Seeding Strategy**: Seed file will populate **real production-ready data**

   - Provider types (General Practitioner, Physiotherapist, etc.)
   - Services (Consultation, X-Ray, etc.)
   - Requirement types (licenses, certifications)

3. **Email Domain Verification**: ⚠️ **Action Required** - Verify SendGrid domain `medbookings.co.za`

   - Set up SPF, DKIM, DMARC records during deployment
   - Ensure email authentication for reliable delivery

4. **Google OAuth Credentials**: Use **same OAuth credentials** for both staging and production

   - Add both callback URLs to Google Cloud Console:
     - `https://medbookings.co.za/api/auth/callback/google` (production)
     - `https://staging.medbookings.co.za/api/auth/callback/google` (staging)

5. **Backup Schedule**: Database backups scheduled for **2-4 AM SAST** (low traffic window)

6. **Alert Severity**: Use **default critical alert configuration**

   - All deployment failures → Critical (email notification)
   - High error rates (>5%) → Critical (email notification)
   - High latency (p95 > 2s) → Critical (email notification)
   - RDS storage warnings → Warning (email notification)

7. **Database User Permissions**: Create **separate read-only database user** for analytics/reporting

   - Main application user: Full read/write access
   - Analytics user: Read-only access (for future reporting tools)

8. **Vercel Blob Storage**: **Migrate to AWS S3** for file storage

   - Replace `BLOB_READ_WRITE_TOKEN` with S3 bucket configuration
   - Update file upload logic to use AWS SDK
   - Add new environment variables: `S3_BUCKET_NAME`, `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`

9. **Monitoring Dashboard**: Use **default AWS dashboards**

   - Amplify Console dashboard for build/deployment metrics
   - RDS Console dashboard for database metrics
   - CloudWatch Logs for application logs
   - (Custom dashboards can be added later if needed)

10. **SSL Certificate Validation**: Use **DNS validation method**

    - Team has DNS access for `medbookings.co.za`
    - DNS validation is automated and doesn't require email access

11. **Multi-AZ Configuration**:

    - **Staging**: Single-AZ (cost optimization) - ~$15/month savings
    - **Production**: Multi-AZ (high availability) - recommended for uptime

12. **Database Migration Strategy**: Create **both databases fresh** from Prisma schema
    - No migration testing needed (fresh deployment)
    - Run `npx prisma migrate deploy` on both environments
    - Run `npx prisma db seed` on both environments

### 📋 Additional Requirements Based on Decisions

**FR-11.1**: Create `staging` branch in GitHub repository

- Branch from current `master` branch
- Configure branch protection rules (require PR reviews)
- Update Amplify to deploy from this branch

**FR-11.2**: Migrate from Vercel Blob to AWS S3

- Create S3 bucket: `medbookings-uploads-production`
- Create S3 bucket: `medbookings-uploads-staging`
- Configure bucket policies for secure access
- Update file upload/download logic to use AWS SDK v3
- Set up CORS policies for client-side uploads
- Configure lifecycle policies for old file cleanup

**FR-11.3**: Configure SendGrid Domain Authentication

- Add SPF record: `v=spf1 include:sendgrid.net ~all`
- Add DKIM records (provided by SendGrid)
- Add DMARC record: `v=DMARC1; p=none; rua=mailto:aws-root@medbookings.co.za`
- Verify domain in SendGrid dashboard

**FR-11.4**: Update Google OAuth Configuration

- Add staging callback URL to Google Cloud Console
- Ensure same OAuth credentials work for both environments
- Test OAuth flow on both staging and production

**FR-11.5**: Create Read-Only Database User

- Username: `medbookings_readonly`
- Permissions: `SELECT` only on all tables
- For future analytics and reporting tools

---

## Next Steps

The PRD is now complete with all decisions finalized. Ready to proceed with:

1. **Implementation Planning**: Break down the deployment into actionable tasks
2. **Infrastructure Setup**: Provision AWS resources (RDS, S3, Amplify)
3. **Code Changes**: S3 migration, environment variable updates
4. **Testing & Validation**: Ensure all success criteria are met

**PRD Status**: ✅ **COMPLETE AND APPROVED**
