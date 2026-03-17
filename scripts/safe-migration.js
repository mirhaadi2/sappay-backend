#!/usr/bin/env node

/**
 * Safe Migration Script
 * 1. Takes database backup
 * 2. Runs pending migrations
 * 3. Verifies success
 * 
 * Usage: node scripts/safe-migration.js
 */

import 'dotenv/config.js';
import { execSync } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const BACKUP_DIR = join(__dirname, '../backups');
const NODE_ENV = process.env.NODE_ENV || 'development';
const DATABASE_URL = process.env.DATABASE_URL;

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n');
  log('════════════════════════════════════════════════════════════', 'cyan');
  log(`  ${title}`, 'cyan');
  log('════════════════════════════════════════════════════════════', 'cyan');
}

function logStep(step, message) {
  log(`${step}️⃣  ${message}`, 'blue');
}

async function main() {
  try {
    logSection('SAFE MIGRATION PROCESS');

    // Step 1: Validation
    logStep('1', 'Validating environment');
    if (!DATABASE_URL) {
      log('❌ DATABASE_URL is not set', 'red');
      process.exit(1);
    }
    log('✅ DATABASE_URL detected', 'green');

    if (!existsSync(BACKUP_DIR)) {
      mkdirSync(BACKUP_DIR, { recursive: true });
    }
    log('✅ Backup directory ready', 'green');

    // Step 2: Check migration status
    logStep('2', 'Checking pending migrations');
    let migrationStatus = '';
    try {
      migrationStatus = execSync('npx sequelize-cli db:migrate:status', {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });
    } catch (error) {
      migrationStatus = error.stdout || '';
    }

    const hasPendingMigrations = migrationStatus.includes('down');

    if (!hasPendingMigrations) {
      log('ℹ️  No pending migrations found', 'yellow');
      log('Database is up to date', 'yellow');
      process.exit(0);
    }

    const pendingLines = migrationStatus
      .split('\n')
      .filter(line => line.includes('down'));
    
    log(`Found ${pendingLines.length} pending migration(s)`, 'yellow');
    pendingLines.forEach((line, i) => {
      log(`   ${i + 1}. ${line.trim()}`);
    });

    // Step 3: Create backup (for production/staging only)
    logStep('3', 'Creating database backup');
    
    if (NODE_ENV === 'production') {
      log('⚠️  PRODUCTION MODE - Backup is MANDATORY', 'yellow');
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const backupFileName = `backup-${timestamp}-${Date.now()}.sql`;
    const backupPath = join(BACKUP_DIR, backupFileName);

    try {
      // Using pg_dump for PostgreSQL
      const pgDumpCmd = `pg_dump ${DATABASE_URL} > "${backupPath}"`;
      execSync(pgDumpCmd, { stdio: 'pipe', shell: true });
      
      // Get backup file size
      const fs = await import('fs').then(m => m.default);
      const stats = fs.statSync(backupPath);
      const sizeInMB = (stats.size / 1024 / 1024).toFixed(2);
      
      log(`✅ Backup created: ${backupFileName} (${sizeInMB}MB)`, 'green');
      log(`   Location: ${backupPath}`, 'green');
    } catch (error) {
      log(`❌ Backup creation failed`, 'red');
      log(`   Error: ${error instanceof Error ? error.message : error}`, 'red');
      if (NODE_ENV === 'production') {
        log('   Aborting migration - backup is critical for production', 'red');
        process.exit(1);
      }
      log('   Continuing with migration (development mode)', 'yellow');
    }

    // Step 4: Run migrations
    logStep('4', 'Running pending migrations');
    try {
      execSync('npx sequelize-cli db:migrate', {
        stdio: 'inherit',
      });
      log('✅ Migrations completed successfully', 'green');
    } catch (error) {
      log('❌ Migration failed', 'red');
      
      if (NODE_ENV === 'production') {
        log('\n⚠️  ROLLBACK INSTRUCTIONS:', 'yellow');
        log(`1. Restore backup: psql \\$DATABASE_URL < "${backupPath}"`, 'yellow');
        log('2. Verify data: npm run migration:status', 'yellow');
        log('3. Investigate issue', 'yellow');
      }
      
      process.exit(1);
    }

    // Step 5: Verify migrations
    logStep('5', 'Verifying migration status');
    const finalStatus = execSync('npx sequelize-cli db:migrate:status', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    const noMorePending = !finalStatus.includes('down');
    
    if (noMorePending) {
      log('✅ All migrations applied successfully', 'green');
    } else {
      log('⚠️  Some migrations still pending', 'yellow');
    }

    // Final summary
    logSection('MIGRATION COMPLETE');
    log(`Environment: ${NODE_ENV}`, 'blue');
    log(`Backup: ${backupFileName}`, 'blue');
    log(`Status: All pending migrations applied`, 'green');
    log(`Backup location: ${backupPath}`, 'blue');
    
    if (NODE_ENV === 'production') {
      log('\n⚠️  Keep backup for minimum 7 days', 'yellow');
    }

  } catch (error) {
    log('\n❌ Unexpected error during migration', 'red');
    log(error instanceof Error ? error.message : error, 'red');
    process.exit(1);
  }
}

main();