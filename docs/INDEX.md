# MedBookings Documentation Index

Welcome to the MedBookings documentation! This index provides a comprehensive overview of all available documentation organized by topic and purpose.

---

## 🚀 Quick Start

**New to the project?** Start here:

1. 📄 [Claude Agent Context](/docs/core/CLAUDE-AGENT-CONTEXT.md) - Quick codebase overview
2. 📄 [Developer Principles](/docs/guides/DEVELOPER-PRINCIPLES.md) - Comprehensive developer reference
3. 📄 [Vercel Deployment](/docs/deployment/VERCEL-DEPLOYMENT.md) - Production deployment guide

---

## Table of Contents

- [Core Documentation](#core-documentation)
- [Compliance & Standards](#compliance--standards)
- [Deployment Guides](#deployment-guides)
- [Setup & Configuration](#setup--configuration)
- [Developer Guides](#developer-guides)
- [By Use Case](#by-use-case)

---

## Core Documentation

Essential documentation for understanding the codebase and architecture.

### 📋 [TODO Tracking](/docs/core/TODO-TRACKING.md)
**Purpose**: Track all TODO/FIXME comments in codebase
**Status**: Updated 2025-11-02
**Contents**:
- High priority tasks (4 items)
- Low priority tasks (13 items)
- Implementation notes with file locations

**When to use**: Check before starting new work, identify areas needing attention

---

### 🗄️ [Database Operations](/docs/core/DATABASE-OPERATIONS.md)
**Purpose**: Comprehensive PostgreSQL + Prisma patterns and best practices
**Status**: Updated 2025-11-02
**Contents**:
- Query patterns (pagination, relations, N+1 prevention)
- Transactions and race condition prevention
- Performance optimization strategies
- Common operations with code examples

**When to use**: Reference when writing database queries, troubleshooting performance issues

---

### 🤖 [Claude Agent Context](/docs/core/CLAUDE-AGENT-CONTEXT.md)
**Purpose**: Fast context loading for AI assistants
**Status**: Refreshed 2025-10-14
**Contents**:
- Quick statistics (routes, components, features)
- Critical files index (7 architecture files)
- Technical architecture overview
- Database schema summary (30+ models)
- Recent changes log

**Token Efficiency**: Reduces analysis from ~72k to ~15k tokens (79% savings)
**When to use**: Start of AI-assisted coding sessions for quick codebase understanding

---

## Compliance & Standards

Documentation ensuring code quality, security, and regulatory compliance.

### 🐛 [Bug Detection](/docs/compliance/BUG-DETECTION.md)
**Purpose**: Common bug patterns and detection strategies
**Contents**:
- Memory leak patterns
- Infinite loop prevention
- N+1 problem detection
- Race condition prevention
- Red flags priority system

**When to use**: Debugging issues, code review, learning common anti-patterns

---

### 🔄 [CLAUDE.md Auto-Sync](/docs/compliance/CLAUDE-MD-AUTO-SYNC.md)
**Purpose**: Explains auto-sync system between CLAUDE.md and enforcement rules
**Contents**:
- Architecture overview with component diagram
- How auto-sync works (6-step process)
- Extracted documentation table (9 docs listed)
- Usage instructions
- Troubleshooting guide

**When to use**: Understanding the validation system, adding new compliance rules

---

### ✅ [Compliance System](/docs/compliance/COMPLIANCE-SYSTEM.md)
**Purpose**: Three-layer enforcement system (IDE, Commit, CI/CD)
**Status**: Most comprehensive compliance doc
**Contents**:
- Architecture (ESLint rules, commit validators, CI/CD)
- 17 validation rules with examples
- Infrastructure file exclusions
- Setup instructions
- Troubleshooting guide
- Coverage summary (85% automation)

**When to use**: Setting up dev environment, understanding validation errors, configuring CI/CD

---

### 📚 [Context Loading](/docs/compliance/CONTEXT-LOADING.md)
**Purpose**: Efficient context loading protocol for AI assistants
**Contents**:
- Efficient workflow (4 steps)
- Task-type specific context table
- Integration points

**When to use**: Optimizing AI assistant interactions, reducing context usage

---

### 🔐 [Security Checklist](/docs/deployment/SECURITY-CHECKLIST.md)
**Purpose**: Production security & POPIA compliance checklist
**Status**: Updated 2025-11-03 (renamed from DEPLOYMENT.md)
**Contents**:
- Pre-deployment security verification
- POPIA compliance requirements (Sections 19, 22, 8, 18)
- Environment variable security
- Post-deployment verification procedures
- Security testing procedures
- Incident response procedures
- Breach notification templates
- Regular maintenance schedule

**When to use**: Before production deployment, security audits, incident response

---

### 🔄 [Development Workflow](/docs/compliance/DEVELOPMENT-WORKFLOW.md)
**Purpose**: Task execution flow and development standards
**Contents**:
- 5-step task execution (Understand → Plan → Implement → Verify → Confirm)
- Development standards (forms, optimistic updates, file conventions)
- Command execution policy
- Database commands reference

**When to use**: Starting new tasks, ensuring consistent workflow

---

### 📊 [Enforcement Coverage](/docs/compliance/ENFORCEMENT-COVERAGE.md)
**Purpose**: Documents current enforcement coverage
**Contents**:
- ESLint rules (7)
- Commit-gate validators (13)
- Native ESLint rules (2)
- Coverage table by category (100% for critical areas)

**When to use**: Understanding what's enforced, planning new enforcement mechanisms

---

### 📝 [Logging](/docs/compliance/LOGGING.md)
**Purpose**: Structured logging system and PHI protection (POPIA compliance)
**Status**: Updated 2025-10-02 (Sprint 4)
**Contents**:
- Console usage policy (when allowed/forbidden)
- Logger methods (debug, info, warn, error, audit)
- Feature flags for debug logging
- PHI protection (sanitization functions)
- POPIA compliance requirements
- Best practices with examples

**When to use**: Adding logging to code, debugging, ensuring PHI protection

---

### 🌍 [Timezone Guidelines](/docs/compliance/TIMEZONE-GUIDELINES.md)
**Purpose**: Mandatory timezone handling patterns (POPIA compliance)
**Status**: Updated 2025-10-02 (Sprint 4)
**Criticality**: ⚠️ HIGH - Timezone bugs = booking disasters
**Contents**:
- Architecture (data flow: Client → Server → Database)
- Available utilities (nowUTC, startOfDaySAST, etc.)
- Correct patterns with examples
- Anti-patterns (DO NOT USE)
- Testing timezone code
- Checklist for new features

**When to use**: Working with dates/times, creating booking features, debugging time-related bugs

---

### 🔒 [Type Safety](/docs/compliance/TYPE-SAFETY.md)
**Purpose**: Type safety best practices and patterns
**Status**: Updated 2025-10-02 (Sprint 4)
**Contents**:
- Type safety hierarchy (Prisma → Zod → tRPC → Components)
- Prisma JSON field handling (critical pattern)
- Type guards (acceptable `as any` use)
- Prisma enum types
- tRPC type exports
- Forbidden patterns

**When to use**: Writing type-safe code, working with Prisma JSON fields, type guard creation

---

### ✔️ [Verification Protocols](/docs/compliance/VERIFICATION-PROTOCOLS.md)
**Purpose**: Route validation and data source verification
**Contents**:
- Route & navigation validation
- Data source verification
- Performance & API monitoring
- Build error resolution protocol

**When to use**: Post-implementation verification, troubleshooting routes

---

## Deployment Guides

Step-by-step guides for deploying to production and staging environments.

### ☁️ [Vercel Deployment](/docs/deployment/VERCEL-DEPLOYMENT.md)
**Purpose**: Complete Vercel deployment guide
**Status**: Current (reflects actual deployment platform)
**Contents**:
- Overview and prerequisites
- Environment variables (complete list)
- Database setup (Neon/Supabase)
- Vercel Blob Storage
- Custom domain configuration
- Security configuration (CRITICAL section with Upstash Redis)
- Post-deployment verification checklist
- Troubleshooting guide

**When to use**: Initial deployment, environment setup, troubleshooting deployment issues

---

### 🚀 [Upstash Redis Setup](/docs/deployment/UPSTASH-REDIS-SETUP.md)
**Purpose**: Upstash Redis configuration for production rate limiting
**Status**: Updated 2025-11-03
**Criticality**: 🔴 REQUIRED for production
**Contents**:
- Why Upstash Redis (distributed rate limiting)
- Quick start (5 minutes)
- Detailed setup with region selection
- Vercel configuration
- Staging environment strategy (shared database approach)
- Verification steps
- Monitoring and troubleshooting
- Cost breakdown (free tier vs paid)

**When to use**: Setting up rate limiting, troubleshooting Redis connection, monitoring usage

---

## Setup & Configuration

Guides for initial project setup and environment configuration.

### ⚙️ [Environment Setup](/docs/setup/ENVIRONMENT-SETUP.md)
**Purpose**: Complete environment setup walkthrough
**Status**: Updated 2025-11-04
**Contents**:
- Quick start guide for new developers
- Security rules (what to never commit)
- File structure (`.env.local`, `.env.example`, `.env.test`)
- Local development setup (Docker, PostgreSQL, Prisma)
- Getting credentials (Google OAuth, SendGrid, Twilio, Upstash)
- Production vs local setup
- Troubleshooting common issues

**When to use**: First-time setup, onboarding new developers, credential management

---

### 📋 [Environment Variables Reference](/docs/setup/ENVIRONMENT-VARIABLES.md)
**Purpose**: Complete reference for all environment variables
**Status**: Created 2025-11-04
**Criticality**: 🔴 REQUIRED for setup
**Contents**:
- Required variables (database, auth, OAuth, storage, email, SMS)
- Optional variables (Redis, additional services)
- Environment-specific values (production, staging, local)
- Variable descriptions and validation
- How to get each credential
- Common validation errors

**When to use**: Reference for any environment variable, troubleshooting config issues, credential setup

---

### 🔐 [Credential Rotation](/docs/deployment/CREDENTIAL-ROTATION.md)
**Purpose**: Security procedures for rotating credentials
**Status**: Updated 2025-11-03
**Contents**:
- Rotation schedule recommendations
- Step-by-step rotation procedures
- Zero-downtime rotation strategies
- Emergency rotation procedures

**When to use**: Regular maintenance, security incidents, credential compromise

---

## Developer Guides

Comprehensive guides for developers working on the MedBookings codebase.

### 📖 [Developer Principles](/docs/guides/DEVELOPER-PRINCIPLES.md)
**Purpose**: Comprehensive developer reference guide
**Status**: Updated 2025-10-09
**Contents**: (20 sections total)
- Critical principles (ALWAYS/NEVER rules)
- Timezone handling (critical for POPIA)
- Type safety & organization
- Logging & PHI protection
- Database operations
- Authentication & authorization
- API development (tRPC)
- Component development
- State management, forms, validation
- Performance, security standards
- File naming, code style, git workflow
- Testing standards
- Quick reference (Forbidden vs Required)

**When to use**: Daily development reference, onboarding, code review

---

### ⚠️ [Actionable Warnings Implementation](/docs/guides/ACTIONABLE-WARNINGS-IMPLEMENTATION.md)
**Purpose**: Implementation plan for enhanced warning system
**Status**: Implementation roadmap (in progress)
**Contents**:
- Problem statement (generic warnings → actionable guidance)
- Architecture (components created)
- Implementation steps (6 phases, 3 complete)
- Success metrics (before/after)
- Rollout plan
- Developer training (5-minute quick start)

**When to use**: Understanding warning system, contributing to implementation

---

### 📝 [Docs Validation Guide](/docs/guides/DOCS-VALIDATION-GUIDE.md)
**Purpose**: Guide for CLAUDE.md ↔ /docs/ alignment validation
**Contents**:
- Quick commands (validate, check status, sync)
- Reference format standard
- Adding new documentation (4-step process)
- Validation output explained
- Troubleshooting (orphaned docs, missing references)
- Expected documentation files (10 listed)

**When to use**: Adding new documentation, validating doc references, troubleshooting validation errors

---

## By Use Case

Find documentation quickly based on what you're trying to accomplish.

### 🆕 Setting Up Development Environment

1. [Vercel Deployment](/docs/deployment/VERCEL-DEPLOYMENT.md) - Environment variables
2. [Upstash Redis Setup](/docs/deployment/UPSTASH-REDIS-SETUP.md) - Rate limiting setup
3. [Compliance System](/docs/compliance/COMPLIANCE-SYSTEM.md) - ESLint rules and git hooks
4. [Developer Principles](/docs/guides/DEVELOPER-PRINCIPLES.md) - Coding standards

### 📝 Writing New Code

1. [Developer Principles](/docs/guides/DEVELOPER-PRINCIPLES.md) - All coding standards
2. [Type Safety](/docs/compliance/TYPE-SAFETY.md) - Type patterns
3. [Database Operations](/docs/core/DATABASE-OPERATIONS.md) - Database queries
4. [Timezone Guidelines](/docs/compliance/TIMEZONE-GUIDELINES.md) - Date/time handling
5. [Logging](/docs/compliance/LOGGING.md) - Adding logs with PHI protection

### 🐛 Debugging Issues

1. [Bug Detection](/docs/compliance/BUG-DETECTION.md) - Common patterns
2. [Verification Protocols](/docs/compliance/VERIFICATION-PROTOCOLS.md) - Testing procedures
3. [Database Operations](/docs/core/DATABASE-OPERATIONS.md) - Query optimization
4. [Development Workflow](/docs/compliance/DEVELOPMENT-WORKFLOW.md) - Build error resolution

### 🚀 Deploying to Production

1. [Security Checklist](/docs/deployment/SECURITY-CHECKLIST.md) - Pre-deployment verification
2. [Vercel Deployment](/docs/deployment/VERCEL-DEPLOYMENT.md) - Deployment steps
3. [Upstash Redis Setup](/docs/deployment/UPSTASH-REDIS-SETUP.md) - Redis configuration
4. [Security Checklist](/docs/deployment/SECURITY-CHECKLIST.md) - Post-deployment verification

### 🔒 Security & Compliance

1. [Security Checklist](/docs/deployment/SECURITY-CHECKLIST.md) - POPIA compliance
2. [Logging](/docs/compliance/LOGGING.md) - PHI protection
3. [Timezone Guidelines](/docs/compliance/TIMEZONE-GUIDELINES.md) - Data integrity
4. [Type Safety](/docs/compliance/TYPE-SAFETY.md) - Secure type handling

### 🤖 Working with AI Assistants

1. [Claude Agent Context](/docs/core/CLAUDE-AGENT-CONTEXT.md) - Fast context loading
2. [Context Loading](/docs/compliance/CONTEXT-LOADING.md) - Efficient workflow
3. [Developer Principles](/docs/guides/DEVELOPER-PRINCIPLES.md) - Comprehensive reference

### 📚 Understanding the Codebase

1. [Claude Agent Context](/docs/core/CLAUDE-AGENT-CONTEXT.md) - Architecture overview
2. [Database Operations](/docs/core/DATABASE-OPERATIONS.md) - Data layer patterns
3. [TODO Tracking](/docs/core/TODO-TRACKING.md) - Known issues and tasks
4. [Developer Principles](/docs/guides/DEVELOPER-PRINCIPLES.md) - Design patterns

### ✅ Code Review & Quality

1. [Compliance System](/docs/compliance/COMPLIANCE-SYSTEM.md) - Automated checks
2. [Bug Detection](/docs/compliance/BUG-DETECTION.md) - What to look for
3. [Developer Principles](/docs/guides/DEVELOPER-PRINCIPLES.md) - Standards reference
4. [Verification Protocols](/docs/compliance/VERIFICATION-PROTOCOLS.md) - Testing checklist

---

## Documentation Maintenance

### Adding New Documentation

1. Create document in appropriate folder
2. Follow naming convention (UPPERCASE-KEBAB-CASE.md)
3. Add reference to CLAUDE.md (see [Docs Validation Guide](/docs/guides/DOCS-VALIDATION-GUIDE.md))
4. Update this INDEX.md with new entry
5. Run validation: `node scripts/compliance/validate-docs.js`

### Documentation Structure

```
docs/
├── INDEX.md (this file)
├── core/ (essential codebase documentation)
│   ├── CLAUDE-AGENT-CONTEXT.md
│   ├── DATABASE-OPERATIONS.md
│   └── TODO-TRACKING.md
├── compliance/ (standards and enforcement)
│   ├── BUG-DETECTION.md
│   ├── CLAUDE-MD-AUTO-SYNC.md
│   ├── COMPLIANCE-SYSTEM.md
│   ├── CONTEXT-LOADING.md
│   ├── DEVELOPMENT-WORKFLOW.md
│   ├── ENFORCEMENT-COVERAGE.md
│   ├── LOGGING.md
│   ├── TIMEZONE-GUIDELINES.md
│   ├── TYPE-SAFETY.md
│   └── VERIFICATION-PROTOCOLS.md
├── deployment/ (production deployment)
│   ├── CREDENTIAL-ROTATION.md
│   ├── SECURITY-CHECKLIST.md
│   ├── UPSTASH-REDIS-SETUP.md
│   └── VERCEL-DEPLOYMENT.md
├── setup/ (project setup and configuration)
│   ├── ENVIRONMENT-SETUP.md
│   └── ENVIRONMENT-VARIABLES.md
├── guides/ (developer guides)
│   ├── ACTIONABLE-WARNINGS-IMPLEMENTATION.md
│   ├── DEVELOPER-PRINCIPLES.md
│   └── DOCS-VALIDATION-GUIDE.md
└── archive/ (historical documentation)
    └── REMEDIATION-STATUS.md
```

---

## Document Status Legend

- ✅ **Current**: Up-to-date and actively maintained
- ⚠️ **In Progress**: Partial implementation or pending updates
- 🔴 **Critical**: Required for production or core functionality
- 📅 **Last Updated**: Check document metadata for update date

---

## Contributing to Documentation

### Documentation Standards

- **Format**: Markdown (.md files)
- **Naming**: UPPERCASE-KEBAB-CASE.md
- **Structure**: Clear sections with table of contents for long docs
- **Examples**: Include code examples where applicable
- **Updates**: Add changelog section for significant updates
- **Metadata**: Include version, last updated, and maintainer info

### Review Process

1. Write documentation following standards
2. Add reference to CLAUDE.md if applicable
3. Update INDEX.md
4. Run validation script
5. Submit PR with `docs:` prefix in commit message

---

## Support & Questions

### Getting Help

- **Technical Questions**: See [Developer Principles](/docs/guides/DEVELOPER-PRINCIPLES.md)
- **Deployment Issues**: See [Vercel Deployment](/docs/deployment/VERCEL-DEPLOYMENT.md)
- **Security Concerns**: See [Security Checklist](/docs/deployment/SECURITY-CHECKLIST.md)
- **Documentation Issues**: See [Docs Validation Guide](/docs/guides/DOCS-VALIDATION-GUIDE.md)

### Feedback

Found an issue or have a suggestion?
- Create an issue in the project repository
- Tag with `documentation` label
- Reference the specific document

---

**Index Version**: 1.0
**Last Updated**: 2025-11-03
**Total Documents**: 19 files
**Maintained By**: Development Team

---

## Quick Links

**Most Frequently Used:**
- [Developer Principles](/docs/guides/DEVELOPER-PRINCIPLES.md)
- [Database Operations](/docs/core/DATABASE-OPERATIONS.md)
- [Timezone Guidelines](/docs/compliance/TIMEZONE-GUIDELINES.md)
- [Logging](/docs/compliance/LOGGING.md)
- [Vercel Deployment](/docs/deployment/VERCEL-DEPLOYMENT.md)

**Critical for Production:**
- [Security Checklist](/docs/deployment/SECURITY-CHECKLIST.md)
- [Upstash Redis Setup](/docs/deployment/UPSTASH-REDIS-SETUP.md)
- [Compliance System](/docs/compliance/COMPLIANCE-SYSTEM.md)
