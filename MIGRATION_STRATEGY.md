# Database Migration Strategy - Production Ready

## 🎯 Core Principles

1. **Explicit over Automatic** - Never auto-run migrations in production
2. **Verify Before Execute** - Always check status before migrating
3. **Reversible** - Every migration must have a rollback path
4. **Zero-Downtime** - Migrations should not block application
5. **Audit Trail** - Keep history of all migrations

---

## 📋 Migration Naming Convention

```
20260317120000-feature-description.js
YYYYMMDDHHMMSS-kebab-case-description
```

**Example:**
```bash
npm run migration:create -- 20260317-add-phone-to-users
```

---

## 🚀 Development Workflow

### 1. Create Migration
```bash
npm run migration:create -- add-new-field
```

### 2. Edit migration file in `src/db/migrations/`
```javascript
module.exports = {
  async up(queryInterface, Sequelize) {
    // Forward migration
  },
  async down(queryInterface, Sequelize) {
    // Rollback logic
  }
};
```

### 3. Check Status (Before Running)
```bash
npm run migration:status
```

### 4. Run Pending Migrations
```bash
npm run migration:up
```

### 5. Test Rollback
```bash
npm run migration:down
npm run migration:up  # Re-apply to verify both work
```

---

## 🏭 Staging/Production Workflow

### Pre-Deployment Checklist
- [ ] All migrations tested locally
- [ ] Database backup created
- [ ] Team reviewed migration code
- [ ] Migration:status shows expected pending migrations
- [ ] No dependencies on uncommitted code

### Step 1: Verify Pending Migrations
```bash
npm run migration:status
# Output should show expected pending migrations
```

### Step 2: Create Backup (ALWAYS)
```bash
# PostgreSQL
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d-%H%M%S).sql

# Verify backup
ls -lh backup-*.sql
```

### Step 3: Run Migrations
```bash
npm run migration:up
```

### Step 4: Verify Application
```bash
# Check app still works
curl http://localhost:4000/health
```

### Step 5: Keep Backup for 7 Days
```bash
# Archive backup
tar czf backups/$(date +%Y%m%d).tar.gz backup-*.sql
```

---

## 🔄 Rollback Strategy

### If Issue Detected Immediately
```bash
npm run migration:down
# This runs the last migration's `down()` function
```

### If Issue Detected After Time Passed
```bash
# 1. Check migration history
npm run migration:status

# 2. Restore from backup
psql $DATABASE_URL < backup-YYYYMMDD-HHMMSS.sql

# 3. Verify data integrity
npm run migration:status
```

### Emergency Procedure
```bash
# Immediate rollback without validation
npm run migration:down:all

# Then restore backup and investigate
```

---

## 🚫 What NOT to Do

❌ **Never**
- Add auto-migration to deployment script without manual approval
- Create migrations on production without testing locally first
- Run migrations during peak traffic hours without load balancing
- Skip backup before production migrations
- Manually edit database, then create migration (causes drift)

---

## 🔐 CI/CD Integration (GitHub Actions Example)

```yaml
name: Deploy with Migrations

on: [push]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Check Migration Status
        run: npm run migration:status
        env:
          DATABASE_URL: ${{ secrets.PROD_DATABASE_URL }}
      
      - name: Deploy Application
        run: npm run build && npm run start
      
      - name: Wait for Health Check
        run: curl --retry 5 https://api.example.com/health
      
      - name: Run Migrations if Required
        if: "contains(github.event.head_commit.message, '[with-migration]')"
        run: npm run migration:up
        env:
          DATABASE_URL: ${{ secrets.PROD_DATABASE_URL }}
          BACKUP_VERIFIED: true
      
      - name: Verify Post-Migration
        run: npm run migration:status
```

---

## 📊 Large Scale Migrations

For migrations affecting millions of rows:

```javascript
// ❌ Bad: Locks table
UPDATE users SET status = 'active' WHERE status IS NULL;

// ✅ Good: Batch processing
module.exports = {
  async up(queryInterface, Sequelize) {
    const batchSize = 10000;
    const lastId = 0;
    
    while (true) {
      const result = await queryInterface.sequelize.query(`
        UPDATE users 
        SET status = 'active' 
        WHERE status IS NULL 
        AND id > :lastId
        LIMIT :batchSize
      `, {
        replacements: { lastId, batchSize },
        type: Sequelize.QueryTypes.UPDATE
      });
      
      if (result[1] < batchSize) break; // No more rows
      lastId += batchSize;
    }
  }
};
```

---

## 📈 Monitoring After Migration

```bash
# Check migration history
npm run migration:status

# Monitor application logs
tail -f logs/app.log | grep -i 'error\|warning'

# Database query performance
# Check slow queries in PostgreSQL logs
```

---

## ✅ Approval Flow for Production

```
Developer Creates Migration
         ↓
Code Review (Team Review)
         ↓
Test in Staging (Full workflow test)
         ↓
Backup Created + Verified
         ↓
DevOps/DBA Approves
         ↓
Production Migration (During maintenance window)
         ↓
Monitoring + Validation
```

---

## 🎓 Key Takeaway for Senior Developers

**Migrations are NOT automatic in production.**

- They're **explicit and deliberate** (requires human decision)
- They're **reversible** (always have down() logic)
- They're **safer than code** (deployed separately with backups)
- They're **auditable** (sequelize_meta table tracks history)

This is enterprise-grade database management.
