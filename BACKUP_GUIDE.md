# Database Backup & Migration Guide

This document explains how to manage database backups and migrations safely.

## What's Included

This system provides automated backup functionality integrated with database migrations to ensure data safety.

### Scripts

1. **safe-migration.js** - Automated backup + migration
2. **backup-database.js** - Manual database backup
3. **restore-backup.js** - Restore from a backup file
4. **cleanup-backups.js** - Clean up old backup files

## Commands

### 1. Safe Migration (Recommended for Development)

Automatically backs up the database before running pending migrations.

```bash
npm run migrate
```

**What it does:**
1. Validates DATABASE_URL is set
2. Checks for pending migrations
3. Creates a timestamped backup: `backup-YYYY-MM-DD-{timestamp}.sql`
4. Runs all pending migrations: `sequelize-cli db:migrate`
5. Verifies all migrations applied successfully
6. Provides rollback instructions if migration fails

**Backup location:** `backups/backup-YYYY-MM-DD-{timestamp}.sql`

---

### 2. Manual Database Backup

Create a backup without running migrations.

```bash
npm run migrate:backup
```

**What it does:**
- Creates a timestamped backup of the current database
- Useful when you want to save database state before making changes
- Shows file size and location

**Output example:**
```
✅ Backup created successfully
   File: backup-2024-01-15-1705321200000.sql
   Size: 2.34MB
   Path: d:\New folder\sappay\backend\backups\backup-2024-01-15-1705321200000.sql
```

---

### 3. Restore from Backup

Restore the database from a previously created backup.

```bash
# List available backups (prompts to choose)
npm run migrate:restore

# Restore specific backup
npm run migrate:restore -- backup-2024-01-15-1705321200000.sql
```

**What it does:**
1. Lists available backups if no file specified
2. Prompts to confirm (in non-production environments)
3. Restores the database from the selected backup
4. Shows success message with next steps

**⚠️ WARNING:** This overwrites the current database. Verify the backup date before proceeding.

---

### 4. Backup Cleanup

Remove old backup files, keeping only the most recent ones.

```bash
# Keep 5 most recent backups (default)
npm run backup:cleanup

# Keep 10 most recent backups
npm run backup:cleanup -- --keep 10

# Preview what would be deleted (dry-run)
npm run backup:cleanup -- --dry-run

# Dry-run with custom keep count
npm run backup:cleanup -- --keep 10 --dry-run
```

**What it does:**
1. Scans the `backups/` directory
2. Sorts backups by creation date (newest first)
3. Keeps N most recent backups
4. Deletes older backups
5. Shows how much space was freed

**Default behavior:** Keeps 5 most recent backups

---

## Sequelize Migration Commands (Advanced)

These are native Sequelize CLI commands for advanced use:

```bash
# Create a new migration file
npm run migration:create -- --name add_new_column

# Check migration status
npm run migration:status

# Run all pending migrations
npm run migration:up

# Undo the last migration
npm run migration:down

# Undo all migrations
npm run migration:down:all
```

---

## Workflow Examples

### Development: Pull latest code and update database

```bash
git pull origin main
npm install
npm run migrate
```

The `migrate` command will automatically backup and apply any new migrations.

### Development: Add a new migration

```bash
# Create migration file
npm run migration:create -- --name add_user_role_column

# Edit the migration file at: src/db/migrations/{timestamp}-add-user-role-column.ts

# Run migration (with automatic backup)
npm run migrate
```

### Production: Before deploying

```bash
# Manual backup first
npm run migrate:backup

# Then run migrations
npm run migrate:backup && npm run migration:up
```

### Oops! Need to restore from backup

```bash
# List available backups and restore
npm run migrate:restore

# Or restore specific backup
npm run migrate:restore -- backup-2024-01-15-1234567890000.sql
```

### Maintenance: Clean up old backups monthly

```bash
# See what would be deleted
npm run backup:cleanup -- --keep 10 --dry-run

# Actually delete old backups
npm run backup:cleanup -- --keep 10
```

---

## Backup File Structure

```
backend/
└── backups/
    ├── backup-2024-01-15-1705254000000.sql (2.34MB) - Oldest
    ├── backup-2024-01-16-1705340400000.sql (2.40MB)
    ├── backup-2024-01-17-1705426800000.sql (2.38MB)
    ├── backup-2024-01-18-1705513200000.sql (2.42MB)
    └── backup-2024-01-19-1705599600000.sql (2.45MB) - Newest
```

**Naming Convention:** `backup-YYYY-MM-DD-{timestamp}.sql`
- Date: When the backup was created
- Timestamp: Unix timestamp for uniqueness
- Format: PostgreSQL dump file (SQL)

---

## Environment Variables Required

For all backup/migration scripts to work, you need:

```bash
DATABASE_URL=postgresql://user:password@localhost:5432/database_name
```

Set in your `.env` file:

```
# .env
DATABASE_URL=postgresql://postgres:password@localhost:5432/sappay_db
NODE_ENV=development
```

---

## Error Messages & Solutions

### "DATABASE_URL is not set"

**Cause:** Missing DATABASE_URL environment variable

**Solution:**
```bash
# Create .env file
echo "DATABASE_URL=postgresql://user:password@localhost:5432/dbname" > .env

# Then retry
npm run migrate
```

### "No backup files found"

**Cause:** No previous backups exist

**Solution:**
```bash
# Create first backup
npm run migrate:backup

# Then restore if needed
npm run migrate:restore
```

### "Backup file not found"

**Cause:** Typo in backup filename

**Solution:**
```bash
# List available backups
npm run migrate:restore

# Copy exact filename and retry
npm run migrate:restore -- backup-2024-01-15-1705321200000.sql
```

### "pg_dump: error" or "psql: error"

**Cause:** PostgreSQL tools not in PATH or database unreachable

**Solution:**
```bash
# For Windows: Add PostgreSQL to PATH
# For macOS/Linux: Install PostgreSQL client tools
brew install libpq

# Verify connection
psql $DATABASE_URL -c "SELECT 1"
```

---

## Best Practices

✅ **DO:**
- Use `npm run migrate` for automated backup + migration
- Keep at least 5-10 recent backups
- Run `backup:cleanup` monthly if backups accumulate
- Test restore procedures in development first
- Document backup location for your team

❌ **DON'T:**
- Run `migrate:restore` on production without confirmation
- Delete recent backups without checking if they're needed
- Skip confirming which backup you're restoring from
- Use `migration:down:all` unless absolutely necessary
- Assume backups exist - verify first

---

## Integration with CI/CD

For GitHub Actions, GitLab CI, or similar:

```yaml
# Example: Run migrations in CI/CD
- name: Run database migrations
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
  run: npm run migrate
```

The script handles non-interactive environments safely.

---

## More Information

- **Migration Files Location:** `backend/src/db/migrations/`
- **Backup Retention:** Keep in `backend/backups/` directory
- **Sequelize Config:** `backend/src/config/database.js`
- **Sequelize CLI Config:** `backend/.sequelizerc`
- **Full Migration Strategy:** See `MIGRATION_STRATEGY.md`

---

**Last Updated:** January 2024
**Version:** 1.0.0
