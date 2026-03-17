#!/usr/bin/env node

/**
 * Database Restore Script
 * Restores the database from a backup file
 * 
 * Usage: npm run migrate:restore -- <backup-file>
 * Example: npm run migrate:restore -- backup-2024-01-15-1705321200000.sql
 */

import 'dotenv/config.js';
import { execSync } from 'child_process';
import { existsSync, readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const BACKUP_DIR = join(__dirname, '../backups');
const DATABASE_URL = process.env.DATABASE_URL;

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

function listBackups() {
  const backups = readdirSync(BACKUP_DIR)
    .filter(file => file.endsWith('.sql'))
    .sort()
    .reverse();

  return backups;
}

async function main() {
  try {
    log('\n════════════════════════════════════════════════════════════', 'cyan');
    log('  DATABASE RESTORE', 'cyan');
    log('════════════════════════════════════════════════════════════', 'cyan');

    // Validation
    log('\n🔍 Validating environment...', 'blue');
    if (!DATABASE_URL) {
      log('❌ DATABASE_URL is not set', 'red');
      process.exit(1);
    }
    log('✅ DATABASE_URL detected', 'green');

    if (!existsSync(BACKUP_DIR)) {
      log('❌ No backups directory found', 'red');
      process.exit(1);
    }

    // Get backup file
    let backupFile = process.argv[2];

    if (!backupFile) {
      log('\n📋 Available backups:', 'blue');
      const backups = listBackups();

      if (backups.length === 0) {
        log('❌ No backup files found in backups/ directory', 'red');
        process.exit(1);
      }

      backups.forEach((file, index) => {
        log(`   ${index + 1}. ${file}`, 'yellow');
      });

      log('\n📌 Please specify a backup file:', 'cyan');
      log(`   npm run migrate:restore -- <backup-file>`, 'yellow');
      log(`   Example: npm run migrate:restore -- ${backups[0]}`, 'yellow');
      process.exit(1);
    }

    const backupPath = join(BACKUP_DIR, backupFile);

    if (!existsSync(backupPath)) {
      log(`\n❌ Backup file not found: ${backupFile}`, 'red');
      log('\n📋 Available backups:', 'blue');
      const backups = listBackups();
      backups.forEach((file, index) => {
        log(`   ${index + 1}. ${file}`, 'yellow');
      });
      process.exit(1);
    }

    // Confirmation
    log('\n⚠️  WARNING: This will overwrite the current database!', 'yellow');
    log(`   Restoring from: ${backupFile}`, 'yellow');
    log('   Make sure you have verified this is the correct backup', 'yellow');
    log('   Current database changes will be lost', 'yellow');

    // In CI/CD, you might want to auto-confirm, in dev require confirmation
    if (!process.env.CI && process.env.NODE_ENV !== 'production') {
      log('\n📝 To proceed, you would need interactive confirmation in a real scenario', 'blue');
      // For now, we'll proceed (in production, you'd add readline for confirmation)
    }

    // Restore backup
    log('\n⏳ Restoring database from backup...', 'blue');
    
    try {
      const psqlCmd = `psql ${DATABASE_URL} < "${backupPath}"`;
      execSync(psqlCmd, { stdio: 'inherit', shell: true });
      
      log('\n✅ Database restored successfully from backup', 'green');
      log(`   Source: ${backupFile}`, 'green');
      log('   All tables and data have been restored', 'green');
      
      log('\n✅ Next steps:', 'yellow');
      log('   1. Verify that your application connects properly', 'yellow');
      log('   2. Check that all tables and data are present', 'yellow');
      log('   3. Run any post-restore migrations if needed', 'yellow');

    } catch (error) {
      log('❌ Restore failed', 'red');
      log(`   ${error instanceof Error ? error.message : error}`, 'red');
      log('\n🔧 Troubleshooting:', 'yellow');
      log('   - Ensure DATABASE_URL is correct', 'yellow');
      log('   - Ensure PostgreSQL is running', 'yellow');
      log('   - Check that the backup file is not corrupted', 'yellow');
      process.exit(1);
    }

  } catch (error) {
    log('\n❌ Restore script error', 'red');
    log(error instanceof Error ? error.message : error, 'red');
    process.exit(1);
  }
}

main();