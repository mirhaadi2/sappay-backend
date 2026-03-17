#!/usr/bin/env node

/**
 * Database Backup Script
 * Creates a backup of the database without running migrations
 * 
 * Usage: npm run migrate:backup
 */

import 'dotenv/config.js';
import { execSync } from 'child_process';
import { existsSync, mkdirSync, statSync } from 'fs';
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

async function main() {
  try {
    log('\n════════════════════════════════════════════════════════════', 'cyan');
    log('  DATABASE BACKUP', 'cyan');
    log('════════════════════════════════════════════════════════════', 'cyan');

    // Validation
    log('\n🔍 Validating environment...', 'blue');
    if (!DATABASE_URL) {
      log('❌ DATABASE_URL is not set', 'red');
      process.exit(1);
    }
    log('✅ DATABASE_URL detected', 'green');

    if (!existsSync(BACKUP_DIR)) {
      mkdirSync(BACKUP_DIR, { recursive: true });
    }

    // Create backup
    log('\n💾 Creating backup...', 'blue');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const backupFileName = `backup-${timestamp}-${Date.now()}.sql`;
    const backupPath = join(BACKUP_DIR, backupFileName);

    try {
      const pgDumpCmd = `pg_dump ${DATABASE_URL} > "${backupPath}"`;
      execSync(pgDumpCmd, { stdio: 'pipe', shell: true });
      
      const stats = statSync(backupPath);
      const sizeInMB = (stats.size / 1024 / 1024).toFixed(2);
      
      log('✅ Backup created successfully', 'green');
      log(`   File: ${backupFileName}`, 'green');
      log(`   Size: ${sizeInMB}MB`, 'green');
      log(`   Path: ${backupPath}`, 'green');
      
      log('\n✅ Keep this file for recovery purposes', 'yellow');

    } catch (error) {
      log('❌ Backup failed', 'red');
      log(`   ${error instanceof Error ? error.message : error}`, 'red');
      process.exit(1);
    }

  } catch (error) {
    log('\n❌ Backup script error', 'red');
    log(error instanceof Error ? error.message : error, 'red');
    process.exit(1);
  }
}

main();