#!/bin/bash
# Database Migration Script: AWS RDS → Neon Postgres (Vercel)
#
# This script exports data from AWS RDS PostgreSQL and prepares it for import to Neon.
# Run this script when you're ready to migrate your production data.
#
# Prerequisites:
# - PostgreSQL client tools installed (pg_dump, psql)
# - AWS RDS credentials (from AWS Secrets Manager or environment)
# - Neon connection string (from Vercel dashboard)

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== MedBookings Database Migration ===${NC}"
echo -e "${GREEN}AWS RDS → Neon Postgres (Vercel)${NC}\n"

# Configuration
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_FILE="medbookings-backup-${TIMESTAMP}.sql"
RDS_HOST="medbookingsinfrastack-production-databaseb269d8bb-gexaxiwsid6a.c9ccmo2uic7g.eu-west-1.rds.amazonaws.com"
RDS_USER="medbookings_admin"
RDS_DB="medbookings"

echo -e "${YELLOW}Step 1: Export from AWS RDS${NC}"
echo "This will create a backup file: ${BACKUP_FILE}"
echo ""

# Check if pg_dump is available
if ! command -v pg_dump &> /dev/null; then
    echo -e "${RED}Error: pg_dump not found. Please install PostgreSQL client tools.${NC}"
    echo "macOS: brew install postgresql"
    echo "Ubuntu: sudo apt-get install postgresql-client"
    exit 1
fi

# Prompt for RDS password
echo -n "Enter AWS RDS password for user ${RDS_USER}: "
read -s RDS_PASSWORD
echo ""

# Export database
echo "Exporting database from AWS RDS..."
PGPASSWORD="${RDS_PASSWORD}" pg_dump \
    -h "${RDS_HOST}" \
    -U "${RDS_USER}" \
    -d "${RDS_DB}" \
    -f "${BACKUP_FILE}" \
    --no-owner \
    --no-acl \
    --verbose

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Export successful!${NC}"
    echo "Backup file size: $(ls -lh ${BACKUP_FILE} | awk '{print $5}')"
    echo ""
else
    echo -e "${RED}✗ Export failed!${NC}"
    exit 1
fi

echo -e "${YELLOW}Step 2: Import to Neon Postgres${NC}"
echo "You'll need your Neon connection string from Vercel dashboard."
echo ""
echo -n "Enter your Neon connection string (POSTGRES_URL_NON_POOLING): "
read NEON_URL
echo ""

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo -e "${RED}Error: psql not found. Please install PostgreSQL client tools.${NC}"
    exit 1
fi

# Import to Neon
echo "Importing database to Neon Postgres..."
psql "${NEON_URL}" -f "${BACKUP_FILE}"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Import successful!${NC}"
    echo ""
else
    echo -e "${RED}✗ Import failed!${NC}"
    echo "You can retry the import manually:"
    echo "psql \"\$NEON_URL\" -f ${BACKUP_FILE}"
    exit 1
fi

echo -e "${YELLOW}Step 3: Verify Data Integrity${NC}"
echo "Checking row counts..."
echo ""

# Verify row counts
psql "${NEON_URL}" -c "
SELECT
  'User' as table_name, COUNT(*) as row_count FROM \"User\" UNION ALL
  SELECT 'Provider', COUNT(*) FROM \"Provider\" UNION ALL
  SELECT 'Organization', COUNT(*) FROM \"Organization\" UNION ALL
  SELECT 'Booking', COUNT(*) FROM \"Booking\" UNION ALL
  SELECT 'Availability', COUNT(*) FROM \"Availability\"
ORDER BY table_name;
"

echo ""
echo -e "${GREEN}=== Migration Complete! ===${NC}"
echo ""
echo "Next steps:"
echo "1. Compare row counts with your AWS RDS database"
echo "2. Test your application with Neon database locally"
echo "3. Update DATABASE_URL in Vercel to use Neon connection"
echo "4. Keep backup file: ${BACKUP_FILE}"
echo ""
echo -e "${YELLOW}IMPORTANT: Keep AWS RDS running for 1-2 weeks as backup!${NC}"
