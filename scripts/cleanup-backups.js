#!/usr/bin/env node

/**
 * Backup Cleanup Script
 * Removes old backup files, keeping only the most recent ones
 * 
 * Usage: npm run backup:cleanup
 * Options:
 *   --keep N: Keep N most recent backups (default: 5)
 *   --dry-run: Show what would be deleted without actually deleting
 */

import 'dotenv/config.js';
import { existsSync, rmSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const BACKUP_DIR = join(__dirname, '../backups');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function parseArgs() {
  const args = process.argv.slice(2);
  let keep = 5;
  let dryRun = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--keep' && args[i + 1]) {
      keep = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === '--dry-run') {
      dryRun = true;
    }
  }

  return { keep, dryRun };
}

async function main() {
  try {
    const { keep, dryRun } = parseArgs();

    log('\n════════════════════════════════════════════════════════════', 'cyan');
    log('  BACKUP CLEANUP', 'cyan');
    log('════════════════════════════════════════════════════════════', 'cyan');

    if (dryRun) {
      log('📋 DRY-RUN MODE - No files will be deleted', 'yellow');
    }

    // Validation
    if (!existsSync(BACKUP_DIR)) {
      log('\n❌ Backups directory not found', 'red');
      process.exit(1);
    }

    // Get backup files
    log('\n🔍 Scanning backup directory...', 'blue');
    const backupFiles = readdirSync(BACKUP_DIR)
      .filter(file => file.endsWith('.sql'))
      .map(file => ({
        name: file,
        path: join(BACKUP_DIR, file),
        mtime: statSync(join(BACKUP_DIR, file)).mtimeMs,
      }))
      .sort((a, b) => b.mtime - a.mtime);

    if (backupFiles.length === 0) {
      log('✅ No backup files found to clean up', 'green');
      process.exit(0);
    }

    log(`✅ Found ${backupFiles.length} backup file(s)`, 'green');

    // Determine files to delete
    const filesToKeep = backupFiles.slice(0, keep);
    const filesToDelete = backupFiles.slice(keep);

    if (filesToDelete.length === 0) {
      log(`\n✅ All ${backupFiles.length} backup(s) are within keep limit (${keep})`, 'green');
      log('   No cleanup needed', 'green');
      process.exit(0);
    }

    // Display files to keep
    log(`\n📌 Keeping ${filesToKeep.length} most recent backup(s):`, 'blue');
    filesToKeep.forEach((file, index) => {
      const sizeInMB = (statSync(file.path).size / 1024 / 1024).toFixed(2);
      const date = new Date(file.mtime);
      log(`   ${index + 1}. ${file.name} (${sizeInMB}MB) - ${date.toLocaleString()}`, 'green');
    });

    // Display files to delete
    log(`\n🗑️  Removing ${filesToDelete.length} old backup(s):`, 'blue');
    let totalSize = 0;
    filesToDelete.forEach((file, index) => {
      const sizeInBytes = statSync(file.path).size;
      const sizeInMB = (sizeInBytes / 1024 / 1024).toFixed(2);
      const date = new Date(file.mtime);
      totalSize += sizeInBytes;
      log(`   ${index + 1}. ${file.name} (${sizeInMB}MB) - ${date.toLocaleString()}`, 'yellow');
    });

    const totalSizeInMB = (totalSize / 1024 / 1024).toFixed(2);
    log(`\n📊 Freeing up: ${totalSizeInMB}MB`, 'cyan');

    if (dryRun) {
      log('📋 DRY-RUN complete - No files were deleted', 'yellow');
      log('\nTo actually delete these files, run:', 'yellow');
      log(`   npm run backup:cleanup -- --keep ${keep}`, 'yellow');
      process.exit(0);
    }

    // Delete old backups
    log('\n⏳ Deleting old backup files...', 'blue');
    let deletedCount = 0;
    let deleteErrors = 0;

    filesToDelete.forEach(file => {
      try {
        rmSync(file.path);
        log(`   ✅ ${file.name}`, 'green');
        deletedCount++;
      } catch (error) {
        log(`   ❌ Failed to delete ${file.name}: ${error instanceof Error ? error.message : error}`, 'red');
        deleteErrors++;
      }
    });

    // Summary
    log('\n' + '═'.repeat(60), 'cyan');
    if (deleteErrors === 0) {
      log(`✅ Cleanup completed successfully`, 'green');
      log(`   Deleted: ${deletedCount} file(s)`, 'green');
      log(`   Freed: ${totalSizeInMB}MB`, 'green');
      log(`   Kept: ${filesToKeep.length} backup(s)`, 'green');
    } else {
      log(`⚠️  Cleanup completed with ${deleteErrors} error(s)`, 'yellow');
      log(`   Successfully deleted: ${deletedCount} file(s)`, 'green');
      log(`   Failed to delete: ${deleteErrors} file(s)`, 'red');
    }

    log('═'.repeat(60) + '\n', 'cyan');

  } catch (error) {
    log('\n❌ Cleanup script error', 'red');
    log(error instanceof Error ? error.message : error, 'red');
    process.exit(1);
  }
}

main();