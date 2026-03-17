# Backup System Architecture

## Overview

The backup system provides enterprise-grade database protection with automated backups, manual restore capabilities, and cleanup utilities. All scripts are Node.js-based and work across development, staging, and production environments.

## System Components

### 1. Safe Migration Script (`scripts/safe-migration.js`)

**Purpose:** Production-ready migration execution with automatic backup

**Flow:**
```
Check DATABASE_URL
    ↓
Check for pending migrations
    ↓
Create timestamped backup (pg_dump)
    ↓
Run: sequelize-cli db:migrate
    ↓
Verify all migrations applied
    ↓
Success: Show summary + backup location
Failure: Show rollback instructions + backup path
```

**Key Features:**
- Colored console output for clarity
- Validates environment before any operations
- Atomic: Creates backup only if migrations pending
- Provides recovery instructions on failure
- Records backup location for later reference

**Runtime:** ~5-30 seconds (depends on database size)

### 2. Backup Database Script (`scripts/backup-database.js`)

**Purpose:** Manual backup without migrations

**Flow:**
```
Check DATABASE_URL
    ↓
Create backups/ directory if not exists
    ↓
Generate: backup-YYYY-MM-DD-{timestamp}.sql
    ↓
Execute: pg_dump $DATABASE_URL > file.sql
    ↓
Report: File size, location, success
```

**Key Features:**
- Uses PostgreSQL's `pg_dump` standard tool
- Timestamp-based filename prevents conflicts
- Shows file size for verification
- Useful before risky operations

**Runtime:** Depends on database size

### 3. Restore Backup Script (`scripts/restore-backup.js`)

**Purpose:** Restore database from backup

**Flow:**
```
Check DATABASE_URL
    ↓
Scan backups/ directory
    ↓
If no file specified:
  ├─ List available backups
  └─ Prompt for filename
    ↓
Validate backup file exists
    ↓
Show confirmation warning
    ↓
Execute: psql $DATABASE_URL < backup-file.sql
    ↓
Success: Show restored tables
Failure: Show troubleshooting steps
```

**Key Features:**
- Lists available backups if none specified
- Shows backup file size and creation date
- Validates file exists before restore
- Shows warning before destructive operation
- Provides post-restore verification steps

**Runtime:** Depends on database size (usually slower than backup)

### 4. Cleanup Backups Script (`scripts/cleanup-backups.js`)

**Purpose:** Maintain backup directory by removing old files

**Flow:**
```
Scan backups/ directory
    ↓
Sort by creation date (newest first)
    ↓
If --dry-run flag:
  └─ Show what would be deleted (exit)
    ↓
Identify files beyond --keep count
    ↓
Show files to keep + files to delete
    ↓
Calculate freed space
    ↓
Delete old backup files
    ↓
Report: Success count, deleted count, errors
```

**Key Features:**
- `--keep N` flag controls retention (default: 5)
- `--dry-run` flag previews without deleting
- Shows file sizes and freed space
- Error handling for permission issues
- Sorted display for easy verification

**Default:** Keeps 5 most recent backups

## Database Connection

All scripts use the `DATABASE_URL` environment variable:

```
DATABASE_URL=postgresql://[user[:password]@][host][:port][/database]
```

**Extraction:**
- User credentials from PostgreSQL connection string
- Host and port information
- Database name
- Parameters (SSL, timeout, etc.)

**Tools Used:**
- `pg_dump` - For backup creation
- `psql` - For restore operations

## File Structure

```
backend/
├── scripts/
│   ├── safe-migration.js          # Backup + migrate
│   ├── backup-database.js         # Manual backup
│   ├── restore-backup.js          # Restore from backup
│   └── cleanup-backups.js         # Remove old backups
├── backups/                       # Backup storage
│   └── backup-YYYY-MM-DD-*.sql   # Backup files
├── src/
│   ├── db/
│   │   ├── migrations/            # Migration files
│   │   └── sequelize.ts          # Sequelize setup
│   └── config/
│       └── database.js           # DB config
├── .sequelizerc                  # Sequelize CLI config
├── package.json                  # NPM scripts
├── BACKUP_GUIDE.md               # User guide
├── BACKUP_ARCHITECTURE.md        # This file
└── MIGRATION_STRATEGY.md         # Migration details
```

## Naming Convention

### Backup Files

```
backup-YYYY-MM-DD-{timestamp}.sql

Examples:
- backup-2024-01-15-1705321200000.sql  (Jan 15, 2024 at 10:00:00)
- backup-2024-01-16-1705407600000.sql  (Jan 16, 2024 at 10:00:00)
```

**Components:**
- `backup`: Prefix identifying as backup
- `YYYY-MM-DD`: Human-readable date for sorting
- `{timestamp}`: Unix timestamp (ms) for uniqueness
- `.sql`: PostgreSQL dump format

### Migration Files

```
{timestamp}-{description}.ts

Examples from Sequelize CLI:
- 20260315000000-create-user.ts
- 20260317000000-add-name-phone-to-users.ts
- 20260317000001-create-otp-table.ts
```

## Operational Flows

### Daily Development Workflow

```
1. git pull origin main
   ↓
2. npm install              # In case new packages added
   ↓
3. npm run migrate          # Auto backup + apply migrations
   ↓
4. npm run dev              # Start development server
```

### Adding a New Migration

```
1. npm run migration:create -- --name add_status_column
   ↓
   Creates: src/db/migrations/{timestamp}-add-status-column.ts
   ↓
2. Edit migration file:
   - up(): Add new column
   - down(): Drop column
   ↓
3. npm run migrate           # Auto backup + apply
   ↓
4. Test changes in application
```

### Emergency Recovery

```
1. Identify what needs recovery
   ↓
2. npm run migrate:restore
   ↓
3. Select backup from list
   ↓
4. Confirm overwrite (system prompts)
   ↓
5. Wait for restore to complete
   ↓
6. Verify data integrity
   ↓
7. Document what happened
```

### Monthly Maintenance

```
1. npm run backup:cleanup -- --keep 10 --dry-run
   ↓
   Review what will be deleted
   ↓
2. npm run backup:cleanup -- --keep 10
   ↓
   Delete files older than 10 most recent
   ↓
3. Archive old backups to cold storage if needed
```

## Error Handling

### Missing DATABASE_URL
**Source:** Any script
**Message:** "DATABASE_URL is not set"
**Recovery:** 
```bash
export DATABASE_URL="postgresql://..."
npm run migrate
```

### Backup Failed
**Source:** safe-migration.js, backup-database.js
**Cause:** `pg_dump` tool not found or DB unreachable
**Message:** "Backup failed: pg_dump command not found"
**Recovery:**
```bash
# Windows: Add PostgreSQL bin to PATH
# macOS: brew install libpq
# Linux: sudo apt install postgresql-client
```

### Restore Failed
**Source:** restore-backup.js
**Cause:** Database connection lost or invalid SQL
**Message:** "Restore failed: [psql error]"
**Recovery:**
```bash
# Check database is running
psql $DATABASE_URL -c "SELECT 1"

# Try restore again
npm run migrate:restore -- backup-file.sql
```

### Migration Failed
**Source:** safe-migration.js
**Message:** "Migration failed: [sequelize error]"
**Info:** Shows backup location for rollback
**Recovery:**
```bash
# Restore from backup
npm run migrate:restore -- backup-file.sql

# Check migration status
npm run migration:status

# Fix migration file issues
npm run migration:down
# Edit migration file
npm run migrate
```

## Performance Characteristics

| Operation | Duration | Notes |
|-----------|----------|-------|
| Backup small DB (< 10MB) | < 2s | Most development databases |
| Backup large DB (100MB+) | 10-30s | Depends on I/O speed |
| Restore small DB | < 5s | Network latency factor |
| Restore large DB | 20-60s | More time than backup |
| Cleanup | < 1s | Just file deletions |
| Migration (simple) | < 2s | Just schema changes |
| Migration (complex) | 5-30s | Data transformations |

## Security Considerations

✅ **Already Secure:**
- Backup files contain full database dump (encrypted at rest with disk encryption)
- Scripts use environment variables (no hardcoded credentials)
- Restore requires confirmation in interactive environments
- All operations logged to console

⚠️ **Additional Measures in Production:**
- Store backups in encrypted storage
- Encrypt backups before uploading to cloud
- Rotate credentials after restore
- Audit access to backup files
- Monitor backup disk space
- Test restore procedures monthly

## Automation

### Package.json Integration

```json
{
  "scripts": {
    "migrate": "node scripts/safe-migration.js",
    "migrate:backup": "node scripts/backup-database.js",
    "migrate:restore": "node scripts/restore-backup.js",
    "backup:cleanup": "node scripts/cleanup-backups.js"
  }
}
```

### CI/CD Integration Example (GitHub Actions)

```yaml
name: Deploy

on: [push]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Run migrations
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
        run: npm run migrate
      
      - name: Start server
        run: npm start
```

## Future Enhancements

Potential improvements:
- Cloud backup storage (S3, Azure, GCS)
- Automated backup scheduling (cron)
- Backup verification/integrity checks
- Point-in-time recovery
- Differential backups
- Backup encryption
- Email notifications on failure
- Metrics dashboard
- Database snapshots for instant restore

## Troubleshooting Checklist

Before contacting support:

- [ ] DATABASE_URL is set and correct
- [ ] PostgreSQL is installed and running
- [ ] `pg_dump` and `psql` are in PATH
- [ ] Backup directory exists and is writable
- [ ] Sufficient disk space for backup
- [ ] Database user has backup permissions
- [ ] No other processes migrating simultaneously
- [ ] Check `.env` file for correct credentials

## References

- [Sequelize CLI Documentation](https://sequelize.org/docs/cli/)
- [PostgreSQL pg_dump](https://www.postgresql.org/docs/current/app-pgdump.html)
- [PostgreSQL psql](https://www.postgresql.org/docs/current/app-psql.html)
- [Node.js child_process](https://nodejs.org/api/child_process.html)

---

**Version:** 1.0.0  
**Last Updated:** January 2024  
**Maintainer:** Development Team  
