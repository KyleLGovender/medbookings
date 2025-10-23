# Database Operations Guide

## Overview

Database operations in staging/production are controlled via Amplify environment variables. This ensures explicit control over potentially destructive operations.

## Environment Variables

Configure these in **Amplify Console → App Settings → Environment Variables**:

| Variable         | Values       | Purpose                                         | When to Use                       |
| ---------------- | ------------ | ----------------------------------------------- | --------------------------------- |
| `RESET_DATABASE` | `true`/unset | **DANGER**: Drops all data and recreates schema | Initial setup or complete reset   |
| `RUN_SEED`       | `true`/unset | Populates database with seed data               | After reset or initial deployment |

## Build Flow

Every Amplify build runs these steps in order:

```bash
# 1. Database Reset (only if RESET_DATABASE=true)
if [ "$RESET_DATABASE" = "true" ]; then
  npx prisma migrate reset --force --skip-seed  # ⚠️ DELETES ALL DATA
fi

# 2. Migrations (ALWAYS runs - safe & idempotent)
npx prisma migrate deploy  # ✅ Applies only new migrations

# 3. Seed (only if RUN_SEED=true)
if [ "$RUN_SEED" = "true" ]; then
  npx prisma db seed  # Populates initial data
fi

# 4. Build application
npm run build
```

## Common Scenarios

### Scenario 1: First-Time Deployment

**Goal**: Set up fresh database with schema and seed data

**Steps**:

1. Go to Amplify Console → Environment Variables
2. Add: `RUN_SEED` = `true`
3. Trigger deployment (commit & push)
4. Wait for successful build
5. **Remove** `RUN_SEED` variable (or set to `false`)

**Result**: Database has tables and seed data

---

### Scenario 2: Schema Changes (Normal Development)

**Goal**: Deploy new migrations

**Steps**:

1. Create migration locally: `npx prisma migrate dev --name my-change`
2. Commit migration files in `prisma/migrations/`
3. Push to staging branch
4. Amplify automatically runs `prisma migrate deploy`

**No environment variables needed** - migrations always run automatically!

**Result**: New schema changes applied, existing data preserved

---

### Scenario 3: Complete Database Reset

**Goal**: Wipe everything and start fresh

**Steps**:

1. Go to Amplify Console → Environment Variables
2. Add: `RESET_DATABASE` = `true`
3. Add: `RUN_SEED` = `true` (if you want seed data after reset)
4. Trigger deployment
5. Wait for successful build
6. **IMMEDIATELY REMOVE** both variables

**⚠️ WARNING**: This deletes ALL data permanently!

**Result**: Fresh database with latest schema (and seed data if requested)

---

### Scenario 4: Re-seed Existing Database

**Goal**: Add/update seed data without losing existing data

**Prerequisites**: Seed script must be idempotent (check if data exists first)

**Steps**:

1. Update `prisma/seed.ts` with idempotency checks
2. Go to Amplify Console → Environment Variables
3. Add: `RUN_SEED` = `true`
4. Trigger deployment
5. Remove `RUN_SEED` variable after success

**Result**: Seed data added/updated, existing data preserved (if seed script is safe)

---

## Safety Checks

### Migration Safety

- ✅ `prisma migrate deploy` is **always safe** - only applies new migrations
- ✅ Runs automatically on every build
- ✅ Idempotent (safe to run multiple times)

### Seed Safety

- ⚠️ **Depends on your seed script implementation**
- Recommend adding checks like:
  ```typescript
  const existingUsers = await prisma.user.count();
  if (existingUsers > 0) {
    console.log('Database already seeded, skipping...');
    return;
  }
  ```

### Reset Safety

- ❌ `prisma migrate reset` is **DESTRUCTIVE**
- Only use for development/testing or complete rebuilds
- Always behind `RESET_DATABASE=true` flag
- Never leave the flag set permanently

## Troubleshooting

### Build fails with "Can't reach database server"

- Check RDS security group allows traffic from Amplify
- Verify `DATABASE_URL` environment variable is correct
- Check RDS instance is running

### Migrations fail with "Migration already applied"

- This is normal - Prisma tracks applied migrations
- Migration will be skipped automatically

### Seed fails with duplicate key errors

- Seed script is not idempotent
- Add checks to skip if data exists (see Seed Safety above)

### "RESET_DATABASE is true but I didn't set it"

- Check Amplify environment variables - someone may have left it set
- Remove immediately to prevent data loss on next build

## Best Practices

1. **Never leave `RESET_DATABASE=true` set** - remove immediately after use
2. **Migrations are automatic** - just commit them, no flags needed
3. **Make seeds idempotent** - check if data exists before inserting
4. **Test locally first** - run migrations/seeds locally before deploying
5. **Document changes** - note in PR when database operations are needed
6. **Backup production** - always backup before major database operations

## Local Development

For local development, use standard Prisma commands:

```bash
# Apply migrations and update Prisma Client
npx prisma migrate dev --name my-change

# Reset local database (safe - only affects local)
npx prisma migrate reset

# Seed local database
npx prisma db seed

# View data in Prisma Studio
npx prisma studio
```

## Production Deployment

Production should follow the same pattern with additional safeguards:

1. **Always test in staging first**
2. **Schedule downtime for breaking changes**
3. **Backup database before major operations**
4. **Use blue-green deployments for zero-downtime**
5. **Monitor after deployment** - check CloudWatch alarms

## Related Files

- `/amplify.yml` - Amplify build configuration
- `/prisma/schema.prisma` - Database schema
- `/prisma/seed.ts` - Seed script
- `/prisma/migrations/` - Migration history
- `/.env` - Local environment variables (DATABASE_URL)
