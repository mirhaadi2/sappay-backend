# npm Scripts Quick Reference

## Core Development
- **npm run dev** → Start development server (auto-reload with ts-node-dev on port 4000)
- **npm run build** → Compile TypeScript to JavaScript in dist/ folder
- **npm start** → Run compiled JavaScript production server

## Code Quality
- **npm run lint** → Check code style with eslint
- **npm test** → Run tests with jest

---

## DATABASE MIGRATIONS (Advanced/Manual)
Use these only if you need to manually control migrations

- **npm run migration:create -- --name add_column** → Create a new empty migration file
- **npm run migration:status** → Show which migrations are applied/pending
- **npm run migration:up** → Run all pending migrations (no backup!)
- **npm run migration:down** → Undo the last migration
- **npm run migration:down:all** → Undo ALL migrations (dangerous!)

---

## BACKUP & MIGRATION (Recommended for production)
Use these for safe database operations

- **npm run migrate** → ⭐ RECOMMENDED: Auto backup + run pending migrations
- **npm run migrate:backup** → Create manual backup file (backup-YYYY-MM-DD-*.sql)
- **npm run migrate:restore** → List backups and restore from a specific backup file
- **npm run backup:cleanup -- --keep 5** → Delete old backups, keep N recent ones (default: 5)
- **npm run backup:cleanup -- --keep 5 --dry-run** → Preview what would be deleted without deleting

---

## DATABASE SEEDING (Add sample data)
- **npm run seed:create -- --name seed_users** → Create a new seeder file
- **npm run seed:up** → Run all seeders to populate test data
- **npm run seed:down** → Undo all seeders

---

## QUICK START WORKFLOW

### First Time Setup
```bash
npm install              # Install dependencies
npm run migrate          # Apply migrations (with backup)
npm run dev             # Start development server
```

### Daily Development
```bash
npm run dev             # Start development
# Make changes, server auto-reloads
```

### Before Pushing Changes
```bash
npm run lint            # Check for code issues
npm run test            # Run tests
npm run build           # Verify build works
```

### Adding Database Changes
```bash
npm run migration:create -- --name add_status_field
# Edit the migration file in src/db/migrations/
npm run migrate         # Run migration (with automatic backup)
```

### Emergency: Restore from Backup
```bash
npm run migrate:restore
# Choose backup file from list
```

### Monthly Cleanup
```bash
npm run backup:cleanup -- --keep 10 --dry-run
npm run backup:cleanup -- --keep 10
```

---

## KEY THINGS TO REMEMBER

✅ **ALWAYS USE** for migrations in production:
- `npm run migrate` (has automatic backup)

❌ **NEVER USE** without backup:
- `npm run migration:up`
- `npm run migration:down`
- `npm run migration:down:all`

💾 **Backup files location:** `backend/backups/`
📝 **Migration files location:** `backend/src/db/migrations/`
🔧 **Database config:** `backend/src/config/database.cjs`
⚙️ **Environment vars:** `backend/.env`

---

## File Names for Reference

When you need to remember what each file does:

| File | Purpose |
|------|---------|
| safe-migration.js | Backup + migrate together |
| backup-database.js | Manual backup only |
| restore-backup.js | Interactive restore from backup |
| cleanup-backups.js | Delete old backup files |

---

**Tip:** Keep this file open in a tab while developing. No need to remember - just check here! 📋
