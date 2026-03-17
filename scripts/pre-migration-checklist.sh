#!/bin/bash

# Pre-Production Migration Checklist
# Usage: ./scripts/pre-migration-checklist.sh

set -e

echo "════════════════════════════════════════════════════════════"
echo "  DATABASE MIGRATION PRE-PRODUCTION CHECKLIST"
echo "════════════════════════════════════════════════════════════"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

checks_passed=0
checks_total=0

check() {
  checks_total=$((checks_total + 1))
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅${NC} $1"
    checks_passed=$((checks_passed + 1))
  else
    echo -e "${RED}❌${NC} $1"
  fi
}

step() {
  echo ""
  echo -e "${YELLOW}$1${NC}"
  echo "─────────────────────────────────────────────────────────"
}

# Step 1: Environment Setup
step "1. Environment Validation"
[ ! -z "$DATABASE_URL" ]
check "DATABASE_URL is set"

[ ! -z "$NODE_ENV" ]
check "NODE_ENV is set"

# Step 2: Database Connectivity
step "2. Database Connectivity"
npm run migration:status > /dev/null 2>&1
check "Database is accessible"

# Step 3: Code Quality
step "3. Code Quality"
npm run lint > /dev/null 2>&1
check "ESLint passes"

npm run test > /dev/null 2>&1
check "Tests pass"

# Step 4: Migration Status
step "4. Migration Status"
echo ""
echo "Pending Migrations:"
npm run migration:status | grep "down" || echo "  (none)"
echo ""

echo "Migration History:"
npm run migration:status | grep "up" | tail -3 || echo "  (none yet)"
echo ""

# Step 5: Backup Verification
step "5. Backup Verification"

if [ "$NODE_ENV" = "production" ]; then
  echo "Production environment detected - backup REQUIRED"
  if [ -z "$BACKUP_VERIFIED" ]; then
    echo -e "${RED}❌${NC} Backup not verified"
    echo "   Run: pg_dump \$DATABASE_URL > backup-\$(date +%Y%m%d-%H%M%S).sql"
    echo "   Then: export BACKUP_VERIFIED=true"
    checks_total=$((checks_total + 1))
  else
    echo -e "${GREEN}✅${NC} Backup verified"
    checks_passed=$((checks_passed + 1))
  fi
else
  echo -e "${GREEN}✅${NC} Development/Staging mode (backup optional)"
  checks_passed=$((checks_passed + 1))
fi

# Step 6: Git Status
step "6. Git Repository Status"
git status --porcelain | wc -l > /tmp/git_changes.txt
changes=$(cat /tmp/git_changes.txt)
if [ "$changes" -eq 0 ]; then
  echo -e "${GREEN}✅${NC} Clean working directory"
  checks_passed=$((checks_passed + 1))
else
  echo -e "${YELLOW}⚠️${NC}  $changes uncommitted changes"
  git status --short
  checks_total=$((checks_total + 1))
fi

# Step 7: Application Build
step "7. Application Build"
npm run build > /dev/null 2>&1
check "Build succeeds"

# Final Summary
echo ""
echo "════════════════════════════════════════════════════════════"
echo "RESULTS: $checks_passed/$checks_total checks passed"
echo "════════════════════════════════════════════════════════════"
echo ""

if [ $checks_passed -eq $checks_total ]; then
  echo -e "${GREEN}✅ Ready for migration${NC}"
  echo ""
  echo "Next steps:"
  echo "  1. npm run migration:up"
  echo "  2. Verify application health"
  echo "  3. Monitor logs for 5 minutes"
  exit 0
else
  echo -e "${RED}❌ Not ready for migration${NC}"
  echo "   Fix the above issues and try again."
  exit 1
fi
