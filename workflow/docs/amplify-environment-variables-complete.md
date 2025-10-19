# AWS Amplify Environment Variables - Complete Checklist

## 📋 All Environment Variables for MedBookings Deployment

---

## 🟩 Production Environment Variables

### **Core Application Variables**

```bash
# 1. Environment
NODE_ENV=production

# 2. NextAuth.js Configuration
NEXTAUTH_URL=https://medbookings.co.za
AUTH_SECRET=<GENERATE_WITH_openssl_rand_-base64_32>

# 3. Database Configuration (PostgreSQL RDS)
DATABASE_URL=postgresql://medbookings_admin:ptzvm0CML6a44DL1WhfGLQkQJPNFYGje@medbookingsinfrastack-production-databaseb269d8bb-gexaxiwsid6a.c9ccmo2uic7g.eu-west-1.rds.amazonaws.com:5432/medbookings?sslmode=require

# 4. AWS S3 Storage
AWS_S3_BUCKET_NAME=medbookings-uploads-production
AWS_REGION=eu-west-1
# Note: AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are NOT needed - IAM role provides credentials

# 5. Google OAuth
GOOGLE_CLIENT_ID=<YOUR_GOOGLE_CLIENT_ID>
GOOGLE_CLIENT_SECRET=<YOUR_GOOGLE_CLIENT_SECRET>

# 6. Google Maps (Client-side)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=<YOUR_GOOGLE_MAPS_API_KEY>

# 7. Twilio (SMS & WhatsApp)
TWILIO_ACCOUNT_SID=<YOUR_TWILIO_ACCOUNT_SID>
TWILIO_AUTH_TOKEN=<YOUR_TWILIO_AUTH_TOKEN>
TWILIO_PHONE_NUMBER=<YOUR_TWILIO_PHONE_NUMBER>
TWILIO_WHATSAPP_NUMBER=<YOUR_TWILIO_WHATSAPP_NUMBER>

# 8. SendGrid (Email)
SENDGRID_API_KEY=<YOUR_SENDGRID_API_KEY>
SENDGRID_FROM_EMAIL=noreply@medbookings.co.za

# 9. Firecrawl (Optional)
FIRECRAWL_API_KEY=<YOUR_FIRECRAWL_API_KEY>

# 10. Admin Configuration
ADMIN_EMAILS=admin@medbookings.co.za
ADMIN_NOTIFICATION_EMAIL=aws-root@medbookings.co.za
```

---

## 🎛️ Database Operation Control Variables (Temporary Use Only)

### **⚠️ IMPORTANT: These are NOT permanent environment variables!**

These should only be added temporarily when needed, then **immediately removed** after the build completes.

### **`RUN_SEED`** (Optional - for first deployment)

```bash
# Add ONLY for first deployment or when you want to seed data
RUN_SEED=true

# ✅ When to add:
# - First deployment to empty database
# - When you want to populate seed data

# ❌ After build completes: REMOVE THIS VARIABLE
```

### **`RESET_DATABASE`** (🚨 DANGER - Wipes all data!)

```bash
# Add ONLY when you need to completely reset the database
RESET_DATABASE=true

# ⚠️ WARNING: This DELETES ALL DATA!
# Only use for:
# - Initial setup on fresh environment
# - Complete database rebuild (destroys all user data)

# ❌ After build completes: IMMEDIATELY REMOVE THIS VARIABLE
```

---

## 🔄 First-Time Deployment Workflow

### **For Production (First Deployment)**

**Step 1: Add all core variables** (see section above)

**Step 2: Add temporary seed flag**

```bash
RUN_SEED=true
```

**Step 3: Trigger deployment** (push to master branch)

**Step 4: Wait for successful build**

**Step 5: IMMEDIATELY remove RUN_SEED**

- Go to Amplify Console → Environment Variables
- Delete the `RUN_SEED` variable
- Save (no redeploy needed)

**Step 6: Verify**

- Check database has tables and seed data
- Test application login and basic functionality

---

## 🟦 Staging Environment Variables

### **Variables That Change for Staging:**

```bash
# Different from production:
NEXTAUTH_URL=https://staging.medbookings.co.za
AUTH_SECRET=<GENERATE_DIFFERENT_SECRET>
DATABASE_URL=postgresql://medbookings_admin:<STAGING_PASSWORD>@medbookingsinfrastack-staging-databaseb269d8bb-ynmq3xvpnv25.c9ccmo2uic7g.eu-west-1.rds.amazonaws.com:5432/medbookings?sslmode=require
AWS_S3_BUCKET_NAME=medbookings-uploads-staging
```

**All other variables** (Google OAuth, Twilio, SendGrid, etc.) can remain the same as production.

**Get staging database password:**

```bash
aws secretsmanager get-secret-value \
  --secret-id medbookings-staging-db-credentials \
  --region eu-west-1 \
  --query SecretString \
  --output text
```

---

## 📊 Complete Variable List Summary

| Variable                          | Required     | Production Value  | Staging Value    | Notes                     |
| --------------------------------- | ------------ | ----------------- | ---------------- | ------------------------- |
| `NODE_ENV`                        | ✅ Yes       | `production`      | `production`     | Always production         |
| `NEXTAUTH_URL`                    | ✅ Yes       | Production URL    | Staging URL      | Environment-specific      |
| `AUTH_SECRET`                     | ✅ Yes       | Unique secret     | Different secret | Generate with openssl     |
| `DATABASE_URL`                    | ✅ Yes       | Production DB     | Staging DB       | From Secrets Manager      |
| `AWS_S3_BUCKET_NAME`              | ✅ Yes       | Production bucket | Staging bucket   | From CDK outputs          |
| `AWS_REGION`                      | ✅ Yes       | `eu-west-1`       | `eu-west-1`      | Same for both             |
| `GOOGLE_CLIENT_ID`                | ✅ Yes       | Shared            | Shared           | Same OAuth app            |
| `GOOGLE_CLIENT_SECRET`            | ✅ Yes       | Shared            | Shared           | Same OAuth app            |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | ✅ Yes       | Shared            | Shared           | Client-side key           |
| `TWILIO_ACCOUNT_SID`              | ✅ Yes       | Shared            | Shared           | Same Twilio account       |
| `TWILIO_AUTH_TOKEN`               | ✅ Yes       | Shared            | Shared           | Same Twilio account       |
| `TWILIO_PHONE_NUMBER`             | ✅ Yes       | Shared            | Shared           | Same phone number         |
| `TWILIO_WHATSAPP_NUMBER`          | ✅ Yes       | Shared            | Shared           | Same WhatsApp number      |
| `SENDGRID_API_KEY`                | ✅ Yes       | Shared            | Shared           | Same SendGrid account     |
| `SENDGRID_FROM_EMAIL`             | ✅ Yes       | Shared            | Shared           | Same sender email         |
| `FIRECRAWL_API_KEY`               | ⚠️ Optional  | Shared            | Shared           | Optional service          |
| `ADMIN_EMAILS`                    | ✅ Yes       | Shared            | Shared           | Admin user list           |
| `ADMIN_NOTIFICATION_EMAIL`        | ✅ Yes       | Shared            | Shared           | Alert recipient           |
| `RUN_SEED`                        | 🔄 Temporary | Add then remove   | Add then remove  | Only for first deployment |
| `RESET_DATABASE`                  | 🚨 Dangerous | Never use         | Rarely use       | Wipes all data!           |

**Total permanent variables: 18-19**  
**Temporary control variables: 2** (add only when needed, then remove)

---

## 🚀 Build Process Flow

Every Amplify build follows this sequence (defined in `amplify.yml`):

```bash
# 1. Install dependencies
npm ci

# 2. Database Reset (ONLY if RESET_DATABASE=true - DESTROYS DATA!)
if [ "$RESET_DATABASE" = "true" ]; then
  npx prisma migrate reset --force --skip-seed
fi

# 3. Migrations (ALWAYS runs automatically - safe & idempotent)
npx prisma migrate deploy

# 4. Seed (ONLY if RUN_SEED=true)
if [ "$RUN_SEED" = "true" ]; then
  npx prisma db seed
fi

# 5. Build application
npm run build
```

### **Key Points:**

- ✅ **Migrations run automatically** on every build (no flag needed)
- ✅ **Safe and idempotent** - same migrations won't apply twice
- ⚠️ **Seeding is opt-in** - only runs when `RUN_SEED=true`
- 🚨 **Reset is dangerous** - only when `RESET_DATABASE=true`

---

## 📝 Common Scenarios

### **Scenario 1: Normal Code Deployment**

**What to do:** Nothing! Just push your code.

- Migrations run automatically
- No environment variables needed
- Existing data preserved

### **Scenario 2: First-Time Deployment**

**What to do:**

1. Add all permanent environment variables
2. Add `RUN_SEED=true`
3. Deploy
4. Remove `RUN_SEED` after successful build

### **Scenario 3: Schema Changes (New Migration)**

**What to do:**

1. Create migration locally: `npx prisma migrate dev --name my-change`
2. Commit migration files
3. Push to branch
4. Migrations run automatically
5. No environment variables needed

### **Scenario 4: Re-seed Database**

**What to do:**

1. Add `RUN_SEED=true`
2. Deploy
3. Remove `RUN_SEED` immediately after
   **Note:** Only works if your seed script is idempotent

### **Scenario 5: Complete Database Reset** (🚨 DANGER)

**What to do:**

1. **Backup data first!**
2. Add `RESET_DATABASE=true`
3. Add `RUN_SEED=true` (if you want seed data)
4. Deploy
5. **IMMEDIATELY remove both variables**
6. Verify application works

---

## 🔒 Security Best Practices

1. ✅ **Never commit secrets to Git** - Use Amplify Console only
2. ✅ **Different AUTH_SECRET per environment** - Generate unique secrets
3. ✅ **Remove temporary flags immediately** - `RUN_SEED`, `RESET_DATABASE`
4. ✅ **Use IAM roles for AWS access** - Don't add AWS credentials manually
5. ✅ **Rotate passwords regularly** - Use AWS Secrets Manager rotation
6. ✅ **Monitor CloudWatch logs** - Check for unauthorized access
7. ✅ **Backup before major operations** - Especially before `RESET_DATABASE`

---

## 🛠️ How to Add Variables in Amplify Console

### **Step-by-Step:**

1. **Navigate to Amplify:**

   - AWS Console → Amplify → Select your app → Environment variables

2. **Add Each Variable:**

   - Click **Manage variables**
   - Click **Add variable**
   - Enter name (e.g., `NODE_ENV`)
   - Enter value (e.g., `production`)
   - Repeat for all variables

3. **Save:**
   - Click **Save**
   - Amplify will automatically redeploy

### **Bulk Add (Faster):**

You can also click **Add multiple variables** to paste multiple key-value pairs at once.

---

## 🧪 Verification Checklist

After adding all environment variables:

- [ ] Total of 18-19 permanent environment variables added
- [ ] `DATABASE_URL` includes `?sslmode=require` at the end
- [ ] `NEXTAUTH_URL` matches your domain (no trailing slash)
- [ ] `AUTH_SECRET` is a random 32+ character string (unique per environment)
- [ ] `AWS_S3_BUCKET_NAME` matches your environment (staging/production)
- [ ] `AWS_REGION` is set to `eu-west-1`
- [ ] NO `AWS_ACCESS_KEY_ID` or `AWS_SECRET_ACCESS_KEY` added (IAM role provides them)
- [ ] `NEXT_PUBLIC_*` variables included (client-side)
- [ ] Google OAuth callback URLs updated in Google Console
- [ ] SendGrid domain verified with DNS records
- [ ] `RUN_SEED=true` added temporarily for first deployment
- [ ] `RUN_SEED` removed after successful first build

---

## 📚 Related Documentation

- `/amplify.yml` - Build configuration with migration logic
- `/docs/database-operations.md` - Detailed database operations guide
- `/workflow/prds/aws-amplify-deployment-prd-tasks.md` - Deployment task list
- `/prisma/seed.mts` - Seed data script

---

**Last Updated:** 2025-01-21  
**Status:** Ready for production deployment ✅
